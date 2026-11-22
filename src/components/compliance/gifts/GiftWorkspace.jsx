import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ListFilter } from 'lucide-react';
import Pagination from '@/components/shared/Pagination';
import GiftExportButton from './GiftExportButton';
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
import { listGifts, filterGifts, deleteGifts, GIFT_FILTER_FIELDS, hasConflict, formatMoneyWhole, financialYearOf } from '@/lib/giftRegister';
import { format } from 'date-fns';
import GiftSummaryCards from './GiftSummaryCards';
import GiftTable from './GiftTable';
import GiftPane from './GiftPane';

const TYPE_TABS = ['All', 'Gift', 'Benefit'];

export default function GiftWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pane, setPane] = useState(null); // { gift } — gift null = add
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { selectedIds, toggle, clear } = useRowSelectionSet();

  const key = ['giftBenefits', register.id];
  const { data: items = [], isLoading, ...read } = useQuery({ queryKey: key, queryFn: () => listGifts(register.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const currentFy = financialYearOf(format(new Date(), 'yyyy-MM-dd'));
  const counts = useMemo(() => ({
    total: items.length,
    value: formatMoneyWhole(items.reduce((s, g) => s + (Number(g.estimated_value) || 0), 0)),
    fyValue: formatMoneyWhole(items.filter((g) => financialYearOf(g.date_received) === currentFy).reduce((s, g) => s + (Number(g.estimated_value) || 0), 0)),
    fyLabel: `Total Estimated Value (This FY ${currentFy.replace('FY', '')})`,
    pending: items.filter((g) => g.approval_decision === 'Pending Decision').length,
    conflicts: items.filter((g) => hasConflict(g.conflict_of_interest)).length,
  }), [items, currentFy]);
  const filterFields = useMemo(() => [
    { id: 'financial_year', label: 'Financial Year', values: [...new Set(items.map((g) => g.financial_year).filter(Boolean))].sort().reverse() },
    ...GIFT_FILTER_FIELDS,
  ], [items]);
  const tabCounts = { All: items.length, Gift: items.filter((g) => g.gift_type === 'Gift').length, Benefit: items.filter((g) => g.gift_type === 'Benefit').length };
  const rows = useMemo(() => filterGifts(items, { type, search, filters }), [items, type, search, filters]);
  const openGift = items.find((g) => g.id === pane?.gift?.id) || pane?.gift || null;
  const selectedList = items.filter((g) => selectedIds.has(g.id));
  useEffect(() => { clear(); }, [type, clear]);
  useEffect(() => { setPage(1); }, [type, search, filters, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openPane = (g, edit = false) => { clear(); setPane({ gift: g, edit }); };
  const handleDelete = guardAction(async () => { await deleteGifts([...selectedIds]); setDeleteOpen(false); clear(); refresh(); }, 'Could not delete the record');
  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">{items.length} record{items.length !== 1 ? 's' : ''} · {counts.pending} pending decision</p>
          </div>
        </div>
        <Button onClick={() => setPane({ gift: null })}><Plus className="w-4 h-4" /> Add Gift or Benefit</Button>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        <div className="mb-6"><GiftSummaryCards counts={counts} /></div>
        <div className="flex items-center gap-3 mb-4">
          <CapsuleTabs animated value={type} onChange={setType} tabs={TYPE_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))} />
          <div className="flex-1" />
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gifts and benefits..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
          </div>
          <div className="relative">
            <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
            {filterOpen && <AssetFilterMenu fields={filterFields} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
          </div>
          <GiftExportButton items={items} selectedItems={selectedList} registerTitle={register.title} />
        </div>
        {isLoading ? (
          <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load gifts and benefits" />
        ) : (
          <>
          <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
            <GiftTable items={paged} onOpen={openPane} selectedIds={selectedIds} onToggle={toggle}
              emptyText={items.length === 0 ? 'No gifts or benefits yet — add your first to start the register.' : 'No gifts or benefits found'} />
          </div>
          {rows.length > 0 && <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </div>

      <GiftPane isOpen={!!pane} onClose={() => setPane(null)} register={register} gift={pane ? openGift : null} startInEdit={!!pane?.edit} onSaved={refresh} />

      <ConfirmTypeDialog
        isOpen={deleteOpen}
        title={selectedIds.size === 1 ? 'Delete Gift or Benefit' : 'Delete Gifts or Benefits'}
        message={`Permanently delete ${selectedIds.size} record${selectedIds.size === 1 ? '' : 's'}? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <AssetBulkBar
        count={pane ? 0 : selectedIds.size}
        onView={() => selectedList[0] && openPane(selectedList[0])}
        onEdit={() => selectedList[0] && openPane(selectedList[0], true)}
        onDelete={() => setDeleteOpen(true)}
        onClear={clear}
      />
    </div>
  );
}