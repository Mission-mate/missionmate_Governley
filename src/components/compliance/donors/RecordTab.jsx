import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { Search, ListFilter } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import useRowSelectionSet from '@/hooks/useRowSelectionSet';
import Pagination from '@/components/shared/Pagination';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import AssetCustomiserPane from '@/components/compliance/assets/AssetCustomiserPane';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import { toast } from '@/components/ui/use-toast';
import { allFields, filterRecords } from '@/lib/donorRegister';
import RecordSummaryCards from './RecordSummaryCards';
import RecordTable from './RecordTable';
import { tableVisibleColumns } from '@/lib/assetRegister';
import RecordPane from './RecordPane';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { base44 } from '@/api/base44Client';

const DONOR_STATUS_DOTS = [{ name: 'Active', dot: 'bg-green-500' }, { name: 'Archived', dot: 'bg-gray-400' }];
import RecordExportButton from './RecordExportButton';

/** One tab of the Donor Register (donors or donations): cards, toolbar, table, pane, customiser, bulk actions. */
export default function RecordTab({ kind, register, items: allItems, isArchived, isLoading, refresh, customColumns, donors, donorName, pane, setPane, customOpen, setCustomOpen, canDelete, onOpenRecord, newDefaults, showSummary = true, showStatusTabs = true, onOpenInProfile, onCreated }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { selectedIds, toggle, clear } = useRowSelectionSet();
  const [view, setView] = useState('active');
  const items = useMemo(() => allItems.filter((r) => isArchived(r) === (view === 'archived')), [allItems, isArchived, view]);
  const archivedCount = useMemo(() => allItems.filter(isArchived).length, [allItems, isArchived]);
  const switchView = (v) => { clear(); setView(v); };

  const fieldOptions = useMemo(() => kind.fieldOptions(register), [kind, register]);
  const fieldsByKey = useMemo(() => Object.fromEntries(allFields(kind, fieldOptions).map((f) => [f.k, f])), [kind, fieldOptions]);
  const tableFields = kind.columns.map((k) => fieldsByKey[k]);
  const filterFields = useMemo(() => kind.filterFields.map((f) => (f.values.length ? f
    : fieldOptions[f.id] ? { ...f, values: fieldOptions[f.id].map((o) => o.name) }
    : { ...f, values: [...new Set(items.map((r) => r[f.id]).filter(Boolean))].sort() })), [kind, items, fieldOptions]);
  const rows = useMemo(() => filterRecords(kind, items, { search, filters }, donorName), [kind, items, search, filters, donorName]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  useEffect(() => { setPage(1); }, [search, filters, view, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => rows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [rows, currentPage, pageSize]);
  const selectedList = useMemo(() => items.filter((r) => selectedIds.has(r.id)), [items, selectedIds]);
  const paneRecord = allItems.find((r) => r.id === pane?.record?.id) || pane?.record || null;
  const open = onOpenRecord || ((r, edit) => setPane({ record: r, edit }));
  useEffect(() => { if (pane) clear(); }, [pane, clear]);

  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });
  const requestDelete = guardAction(async () => {
    const blocked = canDelete ? await canDelete([...selectedIds]) : '';
    if (blocked) toast({ title: 'Cannot delete', description: blocked, variant: 'destructive' });
    else setDeleteOpen(true);
  }, 'Could not check this record');
  const handleDelete = guardAction(async () => { await kind.api.remove([...selectedIds]); setDeleteOpen(false); clear(); refresh(); }, 'Could not delete the record');
  const changeStatus = guardAction(async (status) => {
    await base44.entities.Donor.updateMany({ id: { $in: [...selectedIds] } }, { $set: { status } });
    clear(); refresh();
  }, 'Could not change the status');
  const n = selectedIds.size;

  return (
    <>
      {showSummary && <div className="mb-6"><RecordSummaryCards cards={kind.summary(items)} /></div>}
      <div className="flex items-center gap-3 mb-4">
        {showStatusTabs && <CapsuleTabs animated size="sm" value={view} onChange={switchView}
          tabs={[{ value: 'active', label: 'Active', count: allItems.length - archivedCount }, { value: 'archived', label: 'Archived', count: archivedCount }]} />}
        <div className="flex-1" />
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={kind.searchPlaceholder || `Search ${kind.plural}...`}
            className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
        </div>
        <div className="relative">
          <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
          {filterOpen && <AssetFilterMenu fields={filterFields} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
        </div>
        <RecordExportButton kind={kind} items={rows} allItems={allItems} isArchived={isArchived} fieldOptions={fieldOptions} selectedItems={selectedList} registerTitle={register.title} customColumns={customColumns} donorName={donorName} />
      </div>
      {isLoading ? (
        <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
          <RecordTable fields={tableFields} items={paged} customColumns={tableVisibleColumns(customColumns)} onOpen={(r) => open(r)} selectedIds={selectedIds}
            onToggle={toggle} donorName={donorName}
            emptyText={items.length === 0 ? `No ${kind.plural} yet — add your first to start the register.` : `No ${kind.plural} found`} />
        </div>
      )}
      {!isLoading && rows.length > 0 && (
        <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <RecordPane kind={kind} isOpen={!!pane} onClose={() => setPane(null)} register={register} record={pane ? paneRecord : null} startEdit={pane?.edit} defaults={newDefaults} onOpenRecord={onOpenInProfile} onCreated={onCreated}
        items={allItems} onSaved={refresh} customColumns={customColumns} donors={donors} donorName={donorName} />

      <AssetCustomiserPane isOpen={customOpen} register={register} entity={kind.api.entity()} columnsKey={kind.columnsKey}
        fields={kind.systemFields} getOptions={kind.getOptions} itemNoun={kind.label.toLowerCase()} subtitle={`Manage ${kind.label.toLowerCase()} register columns`} onClose={() => setCustomOpen(false)}
        onSaved={() => Promise.all([qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }), refresh()])} />

      <ConfirmTypeDialog
        isOpen={deleteOpen}
        title={n === 1 ? `Delete ${kind.label}` : `Delete ${kind.label}s`}
        message={`Permanently delete ${n} ${n === 1 ? kind.label.toLowerCase() : kind.plural}? This cannot be recovered.`}
        keyword="DELETE" confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setDeleteOpen(false)}
      />

      <AssetBulkBar count={n} onView={() => selectedList[0] && open(selectedList[0])}
        onEdit={onOpenInProfile ? undefined : () => selectedList[0] && open(selectedList[0], true)} onDelete={onOpenInProfile ? undefined : requestDelete} onClear={clear}
        statusOptions={DONOR_STATUS_DOTS} onChangeStatus={kind.key === 'donor' ? changeStatus : undefined} />
    </>
  );
}