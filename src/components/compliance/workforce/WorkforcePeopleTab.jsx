import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { Search, ListFilter } from 'lucide-react';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import Pagination from '@/components/shared/Pagination';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import { personStats, peopleFilterFields, statusOf, deletePeople, STATUS_DOTS } from '@/lib/workforceRegister';
import { exportPeoplePdf, exportPeopleExcel } from '@/lib/workforceExport';
import WorkforcePeopleTable from './WorkforcePeopleTable';
import WorkforceExportButton from './WorkforceExportButton';
import usePersonStatusChange from './usePersonStatusChange';

const SEARCH_KEYS = ['full_name', 'email', 'role', 'program_area'];
const CARD = 'bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5';

/** Workforce tab: Active/Archived people, search, filter, export, table and single-select actions. */
export default function WorkforcePeopleTab({ register, people, credentials, isLoading, onOpen, refresh }) {
  const [view, setView] = useState('Active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedId, setSelectedId] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const status = usePersonStatusChange(credentials, refresh);

  const stats = useMemo(() => Object.fromEntries(people.map((p) => [p.id, personStats(credentials, p.id)])), [people, credentials]);
  const archivedCount = people.filter((p) => statusOf(p) === 'Archived').length;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => statusOf(p) === view
      && (!q || SEARCH_KEYS.some((k) => String(p[k] || '').toLowerCase().includes(q)))
      && Object.entries(filters).every(([k, v]) => (k === 'compliance' ? stats[p.id].compliance : p[k]) === v));
  }, [people, view, search, filters, stats]);

  useEffect(() => { setPage(1); setSelectedId(null); }, [search, filters, view, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = people.find((p) => p.id === selectedId);

  const applyFilter = (id, v) => setFilters((f) => { const n = { ...f }; if (v) n[id] = v; else delete n[id]; return n; });
  const handleExport = (format, scope) => {
    const scoped = scope === 'selected' ? (selected ? [selected] : []) : people.filter((p) => scope === 'all' || statusOf(p) === scope);
    (format === 'pdf' ? exportPeoplePdf : exportPeopleExcel)(scoped, stats, register.title);
  };
  const handleStatus = guardAction(async (v) => { if (await status.request(selected, v)) setSelectedId(null); }, 'Could not change the status');
  const handleDelete = guardAction(async () => { await deletePeople([selectedId]); setDeleteOpen(false); setSelectedId(null); await refresh(); }, 'Could not delete the person');

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <CapsuleTabs animated size="sm" value={view} onChange={setView}
          tabs={[{ value: 'Active', label: 'Active', count: people.length - archivedCount }, { value: 'Archived', label: 'Archived', count: archivedCount }]} />
        <div className="flex-1" />
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people..."
            className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
        </div>
        <div className="relative">
          <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
          {filterOpen && <AssetFilterMenu fields={peopleFilterFields} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
        </div>
        <WorkforceExportButton selectedCount={selected ? 1 : 0} statusOptions={['Active', 'Archived']} itemLabel="people" onExport={handleExport} />
      </div>
      {isLoading ? (
        <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
      ) : (
        <div className={CARD}>
          <WorkforcePeopleTable items={paged} stats={stats} selectedId={selectedId} onSelect={setSelectedId} onOpen={onOpen}
            emptyText={people.length === 0 ? 'No people yet — add your first to start the register.' : 'No people found'} />
        </div>
      )}
      {!isLoading && rows.length > 0 && (
        <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <AssetBulkBar count={selected ? 1 : 0} statusOptions={STATUS_DOTS} onView={() => onOpen(selected)}
        onChangeStatus={handleStatus} onDelete={() => setDeleteOpen(true)} onClear={() => setSelectedId(null)} />
      <ConfirmTypeDialog isOpen={deleteOpen} title="Delete Person"
        message={`Permanently delete "${selected?.full_name || 'this person'}" and all of their credentials? This cannot be recovered.`}
        keyword="DELETE" confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setDeleteOpen(false)} />
      {status.dialog}
    </>
  );
}