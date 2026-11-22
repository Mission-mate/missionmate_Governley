import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useContactsData } from '@/hooks/useContactsData';
import { useSmartLists } from '@/hooks/useSmartLists';
import ContactsToolbar from '@/components/contacts/ContactsToolbar';
import ContactsTable from '@/components/contacts/ContactsTable';
import Pagination from '@/components/shared/Pagination';
import LoadError from '@/components/shared/states/LoadError';
import AddContactPane from '@/components/contacts/AddContactPane';
import ImportContactsModal from '@/components/contacts/import/ImportContactsModal';
import { useContactTypeConfig } from '@/hooks/useContactTypeConfig';
import ExportToolbarMenu from '@/components/shared/export/ExportToolbarMenu';
import ExportContactsDialog from '@/components/contacts/ExportContactsDialog';
import { exportContactsToExcel, exportContactsToPdf } from '@/lib/contactExport';
import { contactMatches } from '@/lib/contactFilter';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useTags } from '@/hooks/useTags';
import SingleRecordActionBar from '@/components/shared/SingleRecordActionBar';
import BulkDeleteDialog from '@/components/contacts/bulk/BulkDeleteDialog';
import ContactViewPane from '@/components/contacts/ContactViewPane';
import { bulkDeleteContacts } from '@/lib/bulkContacts';
import { useToast } from '@/components/ui/use-toast';

const EMPTY_FILTERS = { contactTypes: [], tags: [], custom: {} };

export default function ContactDatabase() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [activeSmartListId, setActiveSmartListId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [viewContactId, setViewContactId] = useState(null);

  const navigate = useNavigate();
  const { smartLists, createSmartList, isLoading: smartListsLoading } = useSmartLists('contacts');
  const { config: ctConfig, isLoading: ctConfigLoading } = useContactTypeConfig();
  const { fields: customFields, isLoading: customFieldsLoading } = useCustomFields('contacts');
  const { tagMap, isLoading: tagsLoading } = useTags();
  const { toast } = useToast();
  const qc = useQueryClient();

  // Per-contact detail caches live under ['contact', id] — independent of the
  // ['contacts-all'] list cache — so bulk deletes must drop them too, or an
  // open contact detail keeps showing a deleted record.
  const dropDetails = (ids) =>
  ids.forEach((id) => qc.removeQueries({ queryKey: ['contact', id] }));

  const visibleCustomFields = customFields.filter((f) => f.isVisibleInDatabase);

  const clearSelection = () => setSelectedId(null);
  // Single select, as in the Risk Register: clicking the selected row's circle clears it.
  const toggleSelect = (id) => setSelectedId((cur) => (cur === id ? null : id));

  const handleView = () => {
    setViewContactId(selectedId);
    clearSelection();
  };

  const handleSingleEdit = () => navigate(`/contacts/${selectedId}?tab=contact_info`);

  const handleDelete = async () => {
    const ids = [selectedId];
    let result;
    try {
      result = await bulkDeleteContacts(ids);
    } catch {
      result = null;
    }
    if (!result || result.failed > 0) {
      // Leave the dialog open and the selection intact for retry.
      toast({ variant: 'destructive', title: 'Failed to delete contact. Please try again.' });
      return;
    }
    setShowDelete(false);
    clearSelection();
    refetch();
    dropDetails(ids);
    toast({ title: 'Deleted 1 contact.' });
  };

  // Rows + label for a chosen export selection.
  //  - { scope: 'all' }      → all contacts in the database
  //  - { scope: 'selected' } → only the bulk-selected contacts
  //  - { scope: 'group', group } → contacts matching the group's saved filters
  const rowsForSelection = (sel) => {
    if (sel.scope === 'selected') {
      return { rows: allContacts.filter((c) => c.id === selectedId), label: '1 selected' };
    }
    if (sel.scope === 'group' && sel.group) {
      return {
        rows: allContacts.filter((c) => contactMatches(c, { filters: sel.group.filters || {} })),
        label: sel.group.name,
      };
    }
    return { rows: allContacts, label: 'All contacts' };
  };

  // Lets React paint the "Exporting…" state before the heavy work starts.
  const yieldToPaint = () =>
  new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));

  const runExport = async (sel, task) => {
    if (exporting) return; // re-entrancy guard
    const { rows, label } = rowsForSelection(sel);
    if (!rows.length) {toast({ title: 'Nothing to export', description: 'No contacts in this selection.' });return;}
    setExporting(true);
    try {
      await yieldToPaint();
      await task(rows, label);
    } catch {
      toast({ variant: 'destructive', title: 'Export failed. Please try again.' });
    } finally {
      setExporting(false);
    }
  };

  const handleConfirmExcel = (sel) => {
    setShowExcelDialog(false);
    runExport(sel, (rows) => exportContactsToExcel(rows, visibleCustomFields, ctConfig, tagMap));
  };

  const handleConfirmPdf = (sel) => {
    setShowPdfDialog(false);
    runExport(sel, (rows, label) =>
    exportContactsToPdf(rows, visibleCustomFields, ctConfig, tagMap, { scope: label })
    );
  };

  // Reset to page 1 whenever search / filters / page-size change.
  useEffect(() => {setPage(1);setSelectedId(null);}, [searchQuery, filters, pageSize]);

  const {
    items: contacts,
    filtered,
    all: allContacts,
    total,
    totalPages,
    page: safePage,
    isLoading,
    refetch,
    ...read
  } = useContactsData({ page, pageSize, search: searchQuery, filters });

  // The table's Type/Tags columns resolve from async config — hold the table
  // region until every config source has landed, so no column renders blank.
  const configLoading =
  isLoading || tagsLoading || customFieldsLoading || ctConfigLoading || smartListsLoading;

  // Derived from the live list, never a snapshot — so an open view pane picks up
  // bulk edits, and empties out when its contact is deleted.
  const viewContact = viewContactId ? allContacts.find((c) => c.id === viewContactId) : null;

  const handleApplyFilters = (next) => {
    setFilters(next);
    setActiveSmartListId(null);
  };

  const handleSelectSmartList = (list) => {
    setFilters({ contactTypes: [], tags: [], custom: {}, ...(list.filters || {}) });
    setActiveSmartListId(list.id);
  };

  const handleClearSmartList = () => {
    setFilters(EMPTY_FILTERS);
    setActiveSmartListId(null);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Contact Database
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage all people, organisations and key contacts in one central place

          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setShowImport(true)} className="h-10 gap-2 text-sm rounded-lg px-5 font-medium">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button size="sm" onClick={() => setShowAdd(true)} className="h-10 gap-2 text-sm rounded-lg px-5 font-medium">
            <Plus className="w-4 h-4" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <ContactsToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        onSaveSmartList={createSmartList}
        onSelectSmartList={handleSelectSmartList}
        onClearSmartList={handleClearSmartList}
        activeSmartListId={activeSmartListId}
        exportSlot={
        <ExportToolbarMenu
          onExportExcel={() => setShowExcelDialog(true)}
          onExportPdf={() => setShowPdfDialog(true)}
          exporting={exporting} />
        } />
      

      {/* Table */}
      {read.isLoadingError ?
      <LoadError failure={{ ...read, refetch }} title="Couldn’t load contacts" /> :


      <>
          <ContactsTable
          contacts={contacts}
          isLoading={configLoading}
          selectedId={selectedId}
          onToggle={toggleSelect}
          onView={(c) => { clearSelection(); setViewContactId(c.id); }} />

          <Pagination
          page={safePage}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize} />
        
        </>
      }

      <AddContactPane
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onCreated={refetch} />
      

      <ImportContactsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        existingContacts={allContacts}
        onImported={refetch} />
      

      <SingleRecordActionBar
        open={!!selectedId}
        onView={handleView}
        onEdit={handleSingleEdit}
        onDelete={() => setShowDelete(true)}
        onClear={clearSelection} />
      

      <ContactViewPane
        isOpen={!!viewContact}
        contact={viewContact}
        onClose={() => setViewContactId(null)}
        onOpen={() => navigate(`/contacts/${viewContact.id}`)} />

      <BulkDeleteDialog
        isOpen={showDelete}
        count={1}
        onClose={() => setShowDelete(false)}
        onConfirm={handleDelete} />

      <ExportContactsDialog
        variant="excel"
        isOpen={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        onConfirm={handleConfirmExcel}
        smartLists={smartLists}
        smartListsLoading={smartListsLoading}
        selectedCount={selectedId ? 1 : 0} />

      <ExportContactsDialog
        variant="pdf"
        isOpen={showPdfDialog}
        onClose={() => setShowPdfDialog(false)}
        onConfirm={handleConfirmPdf}
        smartLists={smartLists}
        smartListsLoading={smartListsLoading}
        selectedCount={selectedId ? 1 : 0} />

    </div>);

}