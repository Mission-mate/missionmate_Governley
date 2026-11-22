import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Search, Plus, Upload, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { LoaderOne } from '@/components/ui/loaders';
import LoadError from '@/components/shared/states/LoadError';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger } from
'@/components/ui/dropdown-menu';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import MemberSummaryCards from '@/components/membership/MemberSummaryCards';
import MembersTable from '@/components/membership/MembersTable';
import MemberFilterPanel from '@/components/membership/MemberFilterPanel';
import SmartGroupPickerModal from '@/components/shared/SmartGroupPickerModal';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import MemberSortButton from '@/components/membership/MemberSortButton';
import { useSmartLists } from '@/hooks/useSmartLists';
import AddMemberModal from '@/components/membership/AddMemberModal';
import DeleteMemberDialog from '@/components/membership/DeleteMemberDialog';
import MemberViewPane from '@/components/membership/MemberViewPane';
import MemberActionBar from '@/components/membership/MemberActionBar';
import ImportMembersModal from '@/components/membership/import/ImportMembersModal';
import ExportToolbarMenu from '@/components/shared/export/ExportToolbarMenu';
import ExportPdfDialog from '@/components/membership/export/ExportPdfDialog';
import Pagination from '@/components/shared/Pagination';
import { useCustomFields } from '@/hooks/useCustomFields';
import { useTags } from '@/hooks/useTags';
import { exportMembersToExcel, exportMembersToPdf } from '@/lib/memberExport';

const EMPTY_FILTERS = {
  status: [],
  membership_structure_id: [],
  tags: [],
  start_date_sort: null,
  expiration_date_sort: null,
  custom: {}
};

// Number of saved filter selections inside a members smart group.
const countMemberFilters = (f = {}) =>
(f.status?.length || 0) +
(f.membership_structure_id?.length || 0) +
(f.tags?.length || 0) +
Object.values(f.custom || {}).reduce((sum, v) => sum + (v?.length || 0), 0);


export default function Members() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [rowDeleteMember, setRowDeleteMember] = useState(null);
  const [viewMember, setViewMember] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [showGroup, setShowGroup] = useState(false);
  const [activeSmartListId, setActiveSmartListId] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [exporting, setExporting] = useState(false);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [excelDialogOpen, setExcelDialogOpen] = useState(false);

  const { fields: memberCustomFields } = useCustomFields('membership');
  const { tagMap } = useTags();
  const { createSmartList } = useSmartLists('members');

  // Applying a smart group loads its saved filters; clear selection when filters change manually.
  const handleSelectSmartList = (list) => {
    setFilters({ ...EMPTY_FILTERS, ...(list.filters || {}) });
    setActiveSmartListId(list.id);
  };

  const handleClearSmartList = () => {
    setFilters(EMPTY_FILTERS);
    setActiveSmartListId(null);
  };

  // Manual filter/sort edits clear the active smart-group highlight.
  const setFiltersManual = (updater) => {
    setActiveSmartListId(null);
    setFilters(updater);
  };

  const { data: realMembers = [], isLoading, ...read } = useQuery({
    queryKey: ['members'],
    queryFn: () => base44.entities.Member.list('-created_date')
  });
  const members = realMembers;
  const { data: structures = [] } = useQuery({
    queryKey: ['membership_structures'],
    queryFn: () => base44.entities.MembershipStructure.list()
  });
  const { data: tags = [] } = useQuery({
    queryKey: ['tags'],
    queryFn: () => base44.entities.Tag.list()
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['members'] });

  // Single search pass over the full dataset — shared by the tab counts and the
  // processed list so the searchable fields are only defined in one place.
  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
    `${m.first_name} ${m.last_name}`.toLowerCase().includes(q) ||
    (m.email || '').toLowerCase().includes(q) ||
    (m.phone || '').toLowerCase().includes(q)
    );
  }, [members, search]);

  // Dynamic filtering + date sort across the full dataset (all pages).
  const processed = useMemo(() => {
    let list = searched;

    // Tab filter — All shows everything except archived; each status tab shows its own.
    if (activeTab === 'archived') {
      list = list.filter((m) => (m.status || 'active') === 'archived');
    } else if (activeTab === 'all') {
      list = list.filter((m) => (m.status || 'active') !== 'archived');
    } else {
      list = list.filter((m) => (m.status || 'active') === activeTab);
    }

    // Status filter
    if (filters.status?.length) {
      list = list.filter((m) => filters.status.includes(m.status || 'active'));
    }
    // Membership structure filter
    if (filters.membership_structure_id?.length) {
      list = list.filter((m) => filters.membership_structure_id.includes(m.membership_structure_id));
    }
    // Tags filter (member matches if it has any selected tag)
    if (filters.tags?.length) {
      list = list.filter((m) => (m.tags || []).some((t) => filters.tags.includes(t)));
    }
    // Custom field value filters (option-based) + custom date sort key
    const customValueEntries = Object.entries(filters.custom || {}).filter(
      ([key, vals]) => !key.endsWith('__sort') && vals?.length
    );
    customValueEntries.forEach(([fieldId, vals]) => {
      list = list.filter((m) => {
        const v = m.custom_fields?.[fieldId];
        if (Array.isArray(v)) return v.some((x) => vals.includes(x));
        return vals.includes(v);
      });
    });

    // Date sorting — built-in dates take priority, then any custom date field
    const customSortEntry = Object.entries(filters.custom || {}).find(
      ([key, vals]) => key.endsWith('__sort') && vals?.length
    );
    let sortField = null;
    let sortDir = null;
    if (filters.start_date_sort) {sortField = 'start_date';sortDir = filters.start_date_sort;} else
    if (filters.expiration_date_sort) {sortField = 'expiration_date';sortDir = filters.expiration_date_sort;} else
    if (customSortEntry) {sortField = customSortEntry[0].replace('__sort', '');sortDir = customSortEntry[1][0];sortField = `custom:${sortField}`;}

    if (sortField) {
      const getVal = (m) => {
        if (sortField.startsWith('custom:')) return m.custom_fields?.[sortField.slice(7)] || '';
        return m[sortField] || '';
      };
      list = [...list].sort((a, b) => {
        const av = getVal(a);
        const bv = getVal(b);
        if (!av && !bv) return 0;
        if (!av) return 1;
        if (!bv) return -1;
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [searched, filters, activeTab]);

  // Tab counts reflect the current search but ignore the active tab selection.
  const tabCounts = useMemo(() => {
    const by = (s) => searched.filter((m) => (m.status || 'active') === s).length;
    return {
      all: searched.filter((m) => (m.status || 'active') !== 'archived').length,
      active: by('active'),
      expired: by('expired'),
      pending: by('pending'),
      archived: by('archived')
    };
  }, [searched]);

  const tabs = useMemo(() => [
  { value: 'all', label: 'All', count: tabCounts.all },
  { value: 'active', label: 'Active', count: tabCounts.active },
  { value: 'pending', label: 'Pending', count: tabCounts.pending },
  { value: 'expired', label: 'Expired', count: tabCounts.expired },
  { value: 'archived', label: 'Archived', count: tabCounts.archived }],
  [tabCounts]);

  // Reset to page 1 and clear the selection when the register view changes.
  useEffect(() => {setPage(1);setSelectedId(null);}, [search, filters, pageSize, activeTab]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const paged = useMemo(
    () => processed.slice((page - 1) * pageSize, page * pageSize),
    [processed, page, pageSize]
  );

  const selectedMember = useMemo(() => members.find((m) => m.id === selectedId) || null, [members, selectedId]);

  const clearSelection = () => setSelectedId(null);
  // Single select, as in the Risk Register: clicking the selected row's circle clears it.
  const toggleSelect = (id) => setSelectedId((cur) => (cur === id ? null : id));

  // On failure the selection stays so the user can retry.
  const applyStatus = async (status, successTitle) => {
    const name = `${selectedMember.first_name} ${selectedMember.last_name}`;
    try {
      await base44.entities.Member.update(selectedMember.id, { status });
      clearSelection();
      toast({ title: successTitle(name) });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: error?.message || `${name} was not updated.` });
    }
    refresh();
  };

  const handleArchive = () => applyStatus('archived', (name) => `${name} archived`);

  const handleChangeStatus = (status) =>
  applyStatus(status, (name) => `${name} set to ${status.charAt(0).toUpperCase() + status.slice(1)}`);

  const handleRowDelete = async () => {
    if (!rowDeleteMember) return;
    const name = `${rowDeleteMember.first_name} ${rowDeleteMember.last_name}`;
    const id = rowDeleteMember.id;
    setRowDeleteMember(null);
    try {
      await base44.entities.Member.delete(id);
      toast({ title: `${name} deleted` });
      clearSelection();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error?.message || `${name} was not deleted.` });
    }
    refresh();
  };

  // Excel export runs after the user picks a scope. null = all, 'selected' = selected rows.
  const handleExportExcel = (statuses) => {
    setExcelDialogOpen(false);
    const rows = statuses === 'selected' ?
    [selectedMember].filter(Boolean) :
    statuses ?
    members.filter((m) => statuses.includes(m.status || 'active')) :
    members;
    if (rows.length === 0) {toast({ title: 'No members match the selected statuses' });return;}
    setExporting(true);
    try {exportMembersToExcel(rows, memberCustomFields, tagMap, structures);} finally
    {setExporting(false);}
  };

  // PDF export runs after the user picks a scope. null = all, 'selected' = selected rows.
  const handleExportPdf = (statuses) => {
    setPdfDialogOpen(false);
    const rows = statuses === 'selected' ?
    [selectedMember].filter(Boolean) :
    statuses ?
    members.filter((m) => statuses.includes(m.status || 'active')) :
    members;
    if (rows.length === 0) {toast({ title: 'No members match the selected statuses' });return;}
    const meta = {
      scope: statuses === 'selected' ?
      'Selected members' :
      statuses ?
      statuses.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ') :
      'All members'
    };
    setExporting(true);
    try {exportMembersToPdf(rows, tagMap, meta, memberCustomFields, structures);} finally
    {setExporting(false);}
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Membership Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your organisation's memberships</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowImport(true)}
            className="h-10 gap-2 text-sm rounded-lg px-5 font-medium">
            
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button onClick={() => setShowAdd(true)} className="gap-2">
            <Plus className="w-4 h-4" /> Add Member
          </Button>
        </div>
      </div>

      <MemberSummaryCards members={members} structureCount={structures.length} />

      {/* Toolbar — status tabs + search + group + filter on one row */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <CapsuleTabs animated tabs={tabs} value={activeTab} onChange={setActiveTab} />

        <div className="relative w-[290px] ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm bg-background rounded-md" />
          
        </div>

        <ToolbarButton
          icon={LayoutGrid}
          label="Group"
          active={!!activeSmartListId}
          onClick={() => setShowGroup(true)} />

        <MemberFilterPanel
          filters={filters}
          setFilters={setFiltersManual}
          structures={structures}
          tags={tags}
          customFields={memberCustomFields}
          onSaveSmartList={createSmartList} />

        <MemberSortButton filters={filters} setFilters={setFiltersManual} />

        <ExportToolbarMenu
          onExportExcel={() => setExcelDialogOpen(true)}
          onExportPdf={() => setPdfDialogOpen(true)}
          exporting={exporting} />
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ?
        <div className="py-16 flex justify-center">
            <LoaderOne />
          </div> :
        read.isLoadingError ?
        <LoadError failure={read} title="Couldn’t load members" className="shadow-none dark:ring-0" /> :

        <MembersTable
          members={paged}
          structures={structures}
          selectedId={selectedId}
          onToggle={toggleSelect}
          onView={(m) => { clearSelection(); setViewMember(m); }} />
        }
      </div>

      {!isLoading && processed.length > 0 &&
      <Pagination
        page={page}
        totalPages={totalPages}
        total={processed.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[50, 100, 200]} />

      }

      <MemberActionBar
        open={!!selectedMember}
        onChangeStatus={handleChangeStatus}
        onView={() => { setViewMember(selectedMember); clearSelection(); }}
        onEdit={() => navigate(`/membership/members/${selectedMember.id}`)}
        onArchive={handleArchive}
        showArchive={selectedMember?.status !== 'archived'}
        onDelete={() => setRowDeleteMember(selectedMember)}
        onClear={clearSelection} />

      <AddMemberModal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={refresh}
        structures={structures}
        tags={tags} />
      

      <ImportMembersModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        existingMembers={members}
        onImported={refresh} />
      


      <MemberViewPane
        isOpen={!!viewMember}
        member={viewMember}
        structures={structures}
        onClose={() => setViewMember(null)}
        onOpen={() => navigate(`/membership/members/${viewMember.id}`)} />

      <DeleteMemberDialog
        isOpen={!!rowDeleteMember}
        member={rowDeleteMember}
        onClose={() => setRowDeleteMember(null)}
        onConfirm={handleRowDelete} />
      

      <SmartGroupPickerModal
        isOpen={showGroup}
        onClose={() => setShowGroup(false)}
        objectType="members"
        activeId={activeSmartListId}
        onApply={handleSelectSmartList}
        onClear={handleClearSmartList}
        countFilters={countMemberFilters} />

      <ExportPdfDialog
        isOpen={pdfDialogOpen}
        onClose={() => setPdfDialogOpen(false)}
        selectedCount={selectedMember ? 1 : 0}
        onConfirm={handleExportPdf} />

      <ExportPdfDialog
        variant="excel"
        isOpen={excelDialogOpen}
        onClose={() => setExcelDialogOpen(false)}
        selectedCount={selectedMember ? 1 : 0}
        onConfirm={handleExportExcel} />
      
    </div>);

}