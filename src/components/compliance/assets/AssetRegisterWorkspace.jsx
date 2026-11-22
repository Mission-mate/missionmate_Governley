import React, { useState, useMemo, useEffect } from 'react';
import { useLocalToday } from '@/components/LocalDayProvider';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, SlidersHorizontal, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import Pagination from '@/components/shared/Pagination';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import useRowSelectionSet from '@/hooks/useRowSelectionSet';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import { isWarrantyExpired, getAssetCustomColumns, tableVisibleColumns } from '@/lib/assetRegister';
import { listAssets, setAssetsStatus, deleteAssets } from '@/lib/assetRegisterApi';
import { assetPickFields, assetSortFields, filterAndSortAssets } from '@/lib/assetRegisterView';
import AssetChartsView from './AssetChartsView';
import AssetSummaryCards from './AssetSummaryCards';
import AssetTable from './AssetTable';
import AssetToolbar from './AssetToolbar';
import AssetBulkBar from './AssetBulkBar';
import AddAssetPane from './AddAssetPane';
import AssetCustomiserPane from './AssetCustomiserPane';

const STATUS_TABS = ['All', 'Active', 'Disposed'];

export default function AssetRegisterWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tabStatus, setTabStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [view, setView] = useState('list');
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [addOpen, setAddOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { selectedIds, toggle, clear } = useRowSelectionSet();

  const { data: items = [], isLoading, ...read } = useQuery({
    queryKey: ['assetItems', register.id],
    queryFn: () => listAssets(register.id),
  });

  const refreshItems = () => qc.invalidateQueries({ queryKey: ['assetItems', register.id] });
  const refreshRegister = () => qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] });
  const openAsset = (a) => navigate(`/compliance/registers/${register.id}/asset/${a.id}`);

  const fields = useMemo(() => assetPickFields(register), [register]);
  const sortFields = useMemo(() => assetSortFields(register), [register]);
  const customColumns = useMemo(() => getAssetCustomColumns(register), [register]);
  const day = useLocalToday();
  const counts = useMemo(() => ({
    total: items.length,
    active: items.filter((a) => a.status === 'Active').length,
    disposed: items.filter((a) => a.status === 'Disposed').length,
    warranty: items.filter(isWarrantyExpired).length,
  }), [items, day]);
  const tabCounts = { All: counts.total, Active: counts.active, Disposed: counts.disposed };

  const filtered = useMemo(() => filterAndSortAssets(
    items.filter((a) => tabStatus === 'All' || a.status === tabStatus),
    { search, filters: activeFilters, sort }
  ), [items, tabStatus, search, activeFilters, sort]);

  const selectedList = useMemo(() => items.filter((a) => selectedIds.has(a.id)), [items, selectedIds]);

  useEffect(() => { setPage(1); }, [search, tabStatus, pageSize, activeFilters, sort]);
  useEffect(() => { clear(); }, [tabStatus, clear]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const applyFilter = (fieldId, value) => setActiveFilters((prev) => {
    const next = { ...prev };
    if (!value) delete next[fieldId]; else next[fieldId] = value;
    return next;
  });

  const handleChangeStatus = guardAction(async (status) => {
    await setAssetsStatus([...selectedIds], status);
    clear();
    refreshItems();
  }, 'Could not change the status');

  const del = useCascadeDelete(deleteAssets, 'asset');

  const handleDelete = async () => {
    const failed = await del.confirm([...selectedIds]);
    if (!failed.length) { setDeleteOpen(false); clear(); }
    refreshItems();
  };

  const tableProps = { selectedIds, onToggle: toggle, onOpen: openAsset, customColumns: tableVisibleColumns(customColumns) };
  const emptyText = items.length === 0 ? 'No assets yet — add your first asset to start the register.' : 'No assets found';

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">
              {counts.total} asset{counts.total !== 1 ? 's' : ''}
              <span> · {counts.active} active</span>
              {counts.warranty > 0 && <span className="text-destructive"> · {counts.warranty} warranty expired</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add Asset</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        <div className="mb-6"><AssetSummaryCards counts={counts} /></div>

        <div className="flex items-center gap-3 mb-4">
          <div className="shrink-0">
            <CapsuleTabs animated value={tabStatus} onChange={setTabStatus} size="sm" tabs={STATUS_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))} />
          </div>
          <div className="flex-1" />
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assets..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]"
            />
          </div>
          <AssetToolbar
            fields={fields} sortFields={sortFields} items={items} selectedItems={selectedList} registerTitle={register.title}
            activeFilters={activeFilters} onApplyFilter={applyFilter} onClearFilter={() => setActiveFilters({})}
            view={view} onViewChange={setView}
            sort={sort} onApplySort={setSort} onClearSort={() => setSort(null)}
          />
        </div>

        {isLoading ? (
          <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load assets" />
        ) : view === 'charts' ? (
          <AssetChartsView items={items} fields={fields} />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
              <AssetTable items={paged} {...tableProps} emptyText={emptyText} />
            </div>
            {filtered.length > 0 && (
              <Pagination page={currentPage} totalPages={totalPages} total={filtered.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
            )}
          </>
        )}
      </div>

      <AddAssetPane isOpen={addOpen} onClose={() => setAddOpen(false)} register={register} items={items} onSaved={refreshItems} />
      <AssetCustomiserPane
        isOpen={customOpen}
        register={register}
        onClose={() => setCustomOpen(false)}
        onSaved={() => Promise.all([refreshRegister(), refreshItems()])}
      />

      <ConfirmTypeDialog
        isOpen={deleteOpen}
        title={selectedIds.size === 1 ? 'Delete Asset' : 'Delete Assets'}
        message={`Permanently delete ${selectedIds.size} asset${selectedIds.size === 1 ? '' : 's'}? Linked maintenance entries, notes, documents and folders will be deleted too. This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        error={del.error}
        onConfirm={handleDelete}
        onClose={() => { setDeleteOpen(false); del.clearError(); }}
      />

      <AssetBulkBar
        count={selectedIds.size}
        onView={() => selectedList[0] && openAsset(selectedList[0])}
        onChangeStatus={handleChangeStatus}
        onDelete={() => setDeleteOpen(true)}
        onClear={clear}
      />
    </div>
  );
}