import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ListFilter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { addDays } from 'date-fns';
import { useLocalToday } from '@/components/LocalDayProvider';
import { toLocalISODate } from '@/lib/localClock';
import Pagination from '@/components/shared/Pagination';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import useRowSelectionSet from '@/hooks/useRowSelectionSet';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import { formatMoneyWhole } from '@/lib/giftRegister';
import { base44 } from '@/api/base44Client';
import AssetCustomiserPane from '@/components/compliance/assets/AssetCustomiserPane';
import { listContracts, filterContracts, deleteContracts, setContractsStatus, contractFilterFields, getContractOptions, getContractTypes, CONTRACT_TYPE_FIELDS } from '@/lib/contractRegister';
import ContractSummaryCards from './ContractSummaryCards';
import ContractTable from './ContractTable';
import ContractPane from './ContractPane';
import ContractExportButton from './ContractExportButton';
import AssetSortMenu from '@/components/compliance/assets/toolbar/AssetSortMenu';

const SORT_FIELDS = [{ id: 'start_date', label: 'Start Date' }, { id: 'expiry_date', label: 'Expiry Date' }, { id: 'next_review_date', label: 'Next Review Date' }];
const STATUS_TABS = ['Active', 'Archived'];
const BAR_STATUSES = [{ name: 'Active', dot: 'bg-green-500' }, { name: 'Archived', dot: 'bg-muted-foreground' }];

export default function ContractWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Active');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState(null); // { field, direction }
  const [sortOpen, setSortOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { selectedIds, toggle, clear } = useRowSelectionSet();

  const key = ['contracts', register.id];
  const { data: items = [], isLoading, ...read } = useQuery({ queryKey: key, queryFn: () => listContracts(register.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: key });
  const [customOpen, setCustomOpen] = useState(false);

  const today = useLocalToday();
  const counts = useMemo(() => {
    const soon = toLocalISODate(addDays(new Date(), 90));
    const active = items.filter((c) => (c.status || 'Active') === 'Active');
    return {
      active: active.length,
      value: formatMoneyWhole(active.reduce((s, c) => s + (Number(c.value) || 0), 0)),
      expiring: active.filter((c) => c.expiry_date && c.expiry_date >= today && c.expiry_date <= soon).length,
      reviewDue: active.filter((c) => c.next_review_date && c.next_review_date < today).length,
    };
  }, [items, today]);
  const tabCounts = { Active: counts.active, Archived: items.length - counts.active };
  const rows = useMemo(() => {
    const list = filterContracts(items, { status, search, filters });
    if (!sort) return list;
    const dir = sort.direction === 'desc' ? -1 : 1;
    // Undated contracts always sort last.
    return [...list].sort((a, b) => {
      const x = a[sort.field] || ''; const y = b[sort.field] || '';
      if (!x || !y) return x ? -1 : y ? 1 : 0;
      return x.localeCompare(y) * dir;
    });
  }, [items, status, search, filters, sort]);
  const selectedList = items.filter((c) => selectedIds.has(c.id));
  useEffect(() => { clear(); }, [status, clear]);
  useEffect(() => { setPage(1); }, [status, search, filters, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openContract = (c) => navigate(`/compliance/registers/${register.id}/contract/${c.id}`);
  const handleDelete = guardAction(async () => { await deleteContracts([...selectedIds]); setDeleteOpen(false); clear(); refresh(); }, 'Could not delete the contract');
  const handleStatus = guardAction(async (s) => { await setContractsStatus([...selectedIds], s); clear(); refresh(); }, 'Could not change the status');
  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">{items.length} contract{items.length !== 1 ? 's' : ''} · {counts.reviewDue} review{counts.reviewDue !== 1 ? 's' : ''} overdue</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { clear(); setCustomOpen(true); }}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button onClick={() => { clear(); setAddOpen(true); }}><Plus className="w-4 h-4" /> Add Contract</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        <div className="mb-6"><ContractSummaryCards counts={counts} /></div>
        <div className="flex items-center gap-3 mb-4">
          <CapsuleTabs animated value={status} onChange={setStatus} size="sm" tabs={STATUS_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))} />
          <div className="flex-1" />
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search contracts..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
          </div>
          <div className="relative">
            <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => { setSortOpen(false); setFilterOpen((o) => !o); }} />
            {filterOpen && <AssetFilterMenu fields={contractFilterFields(register)} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
          </div>
          <div className="relative">
            <ToolbarButton icon={ArrowUpDown} label="Sort" active={!!sort} onClick={() => { setFilterOpen(false); setSortOpen((o) => !o); }} />
            {sortOpen && <AssetSortMenu sort={sort} sortFields={SORT_FIELDS} onApply={setSort} onClear={() => setSort(null)} onClose={() => setSortOpen(false)} />}
          </div>
          <ContractExportButton items={rows} allItems={items} selectedItems={selectedList} registerTitle={register.title} typeOptions={getContractTypes(register)} />
        </div>
        {isLoading ? (
          <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load contracts" />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
              <ContractTable items={paged} typeOptions={getContractTypes(register)} onOpen={openContract} selectedIds={selectedIds} onToggle={toggle}
                emptyText={items.length === 0 ? 'No contracts yet — add your first to start the register.' : `No ${status.toLowerCase()} contracts found`} />
            </div>
            {rows.length > 0 && <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </div>

      <ContractPane isOpen={addOpen} onClose={() => setAddOpen(false)} register={register} onSaved={refresh} />
      <AssetCustomiserPane
        isOpen={customOpen}
        register={register}
        onClose={() => setCustomOpen(false)}
        onSaved={() => Promise.all([qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }), refresh()])}
        entity={base44.entities.Contract}
        fields={CONTRACT_TYPE_FIELDS}
        getOptions={getContractOptions}
        itemNoun="contract"
        subtitle="Manage contract register fields"
      />

      <ConfirmTypeDialog
        isOpen={deleteOpen}
        title={selectedIds.size === 1 ? 'Delete Contract' : 'Delete Contracts'}
        message={`Permanently delete ${selectedIds.size} contract${selectedIds.size === 1 ? '' : 's'} with their notes and documents? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <AssetBulkBar
        count={addOpen ? 0 : selectedIds.size}
        statusOptions={BAR_STATUSES}
        onView={() => selectedList[0] && openContract(selectedList[0])}
        onEdit={() => selectedList[0] && openContract(selectedList[0])}
        onChangeStatus={handleStatus}
        onDelete={() => setDeleteOpen(true)}
        onClear={clear}
      />
    </div>
  );
}