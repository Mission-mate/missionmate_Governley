import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { Search, ListFilter } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import Pagination from '@/components/shared/Pagination';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import ConflictSummaryCards from '@/components/board/conflicts/ConflictSummaryCards';
import useRowSelectionSet from '@/hooks/useRowSelectionSet';
import { declarantStats, personTypeOptions, ARCHIVED } from '@/lib/declarantRegister';
import DeclarantTable from './DeclarantTable';
import DeleteCoiPersonDialog from './DeleteCoiPersonDialog';

const STATUS_DOTS = [{ name: 'Active', dot: 'bg-green-500' }, { name: 'Archived', dot: 'bg-gray-400' }];
const SEARCH_KEYS = ['full_name', 'declarant_code', 'email', 'role'];

/** Declarants Register tab: summary cards, Active/Archived, search, filter, table, bulk actions. */
export default function DeclarantsTab({ register, people, conflicts, activeConflicts, isLoading, onOpen }) {
  const qc = useQueryClient();
  const [view, setView] = useState('active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { selectedIds, toggle, clear } = useRowSelectionSet();

  const typeOptions = useMemo(() => personTypeOptions(register), [register]);
  const stats = useMemo(() => Object.fromEntries(people.map((p) => [p.id, declarantStats(conflicts, p.id)])), [people, conflicts]);
  const archivedCount = people.filter((p) => p.status === ARCHIVED).length;
  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => (p.status === ARCHIVED) === (view === 'archived')
      && (!q || SEARCH_KEYS.some((k) => String(p[k] || '').toLowerCase().includes(q)))
      && Object.entries(filters).every(([k, v]) => (p[k] || '') === v));
  }, [people, view, search, filters]);
  const filterFields = [{ id: 'person_type', label: 'Person Type', values: typeOptions.map((o) => o.name) }];

  useEffect(() => { setPage(1); clear(); }, [search, filters, view, pageSize, clear]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const selected = people.find((p) => selectedIds.has(p.id));

  const applyFilter = (id, v) => setFilters((f) => { const n = { ...f }; if (v) n[id] = v; else delete n[id]; return n; });
  const changeStatus = guardAction(async (status) => {
    await base44.entities.CoiPerson.update(selected.id, { status });
    clear();
    qc.invalidateQueries({ queryKey: ['coiPeople', register.id] });
  }, 'Could not change the status');

  return (
    <>
      {/* Shared with the Declarations Register — Active declarants' declarations only. */}
      <ConflictSummaryCards conflicts={activeConflicts} />
      <div className="flex items-center gap-3 mb-4">
        <CapsuleTabs animated size="sm" value={view} onChange={setView}
          tabs={[{ value: 'active', label: 'Active', count: people.length - archivedCount }, { value: 'archived', label: 'Archived', count: archivedCount }]} />
        <div className="flex-1" />
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search declarants..."
            className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
        </div>
        <div className="relative">
          <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
          {filterOpen && <AssetFilterMenu fields={filterFields} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
        </div>
      </div>
      {isLoading ? (
        <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
          <DeclarantTable items={paged} stats={stats} typeOptions={typeOptions} selectedIds={selectedIds} onToggle={toggle} onOpen={onOpen}
            emptyText={people.length === 0 ? 'No declarants yet — add your first to start the register.' : 'No declarants found'} />
        </div>
      )}
      {!isLoading && rows.length > 0 && (
        <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}

      <AssetBulkBar count={selectedIds.size} statusOptions={STATUS_DOTS} onView={() => selected && onOpen(selected)}
        onChangeStatus={changeStatus} onDelete={() => { setDeleting({ user_id: selected.id, name: selected.full_name }); clear(); }} onClear={clear} />
      <DeleteCoiPersonDialog person={deleting} onClose={() => setDeleting(null)} />
    </>
  );
}