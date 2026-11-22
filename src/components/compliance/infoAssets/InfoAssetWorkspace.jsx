import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import useRowSelectionSet from '@/hooks/useRowSelectionSet';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ListFilter, SlidersHorizontal } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AssetCustomiserPane from '@/components/compliance/assets/AssetCustomiserPane';
import { getAssetCustomColumns, tableVisibleColumns } from '@/lib/assetRegister';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import { listInfoAssets, filterInfoAssets, INFO_FILTER_FIELDS, setInfoAssetsStatus, deleteInfoAssets, INFO_BULK_STATUS_OPTIONS } from '@/lib/infoAssetRegister';
import InfoAssetSummaryCards from './InfoAssetSummaryCards';
import InfoAssetTable from './InfoAssetTable';
import InfoAssetPane from './InfoAssetPane';
import InfoAssetExportButton from './InfoAssetExportButton';

const STATUS_TABS = ['All', 'Active', 'Superseded'];

export default function InfoAssetWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [filterOpen, setFilterOpen] = useState(false);
  const [pane, setPane] = useState(null); // { asset } — asset null = add
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const customColumns = useMemo(() => getAssetCustomColumns(register), [register]);
  const { selectedIds, toggle, clear } = useRowSelectionSet();

  const key = ['infoAssets', register.id];
  const { data: items = [], isLoading, ...read } = useQuery({ queryKey: key, queryFn: () => listInfoAssets(register.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const counts = useMemo(() => ({
    total: items.length,
    active: items.filter((a) => a.status === 'Active').length,
    superseded: items.filter((a) => a.status === 'Superseded').length,
    personal: items.filter((a) => a.personal_information === 'Yes').length,
    security: items.filter((a) => a.national_security === 'Yes').length,
  }), [items]);
  const tabCounts = { All: counts.total, Active: counts.active, Superseded: counts.superseded };
  const rows = useMemo(() => filterInfoAssets(items, { status, search, filters }), [items, status, search, filters]);
  const openAsset = items.find((a) => a.id === pane?.asset?.id) || pane?.asset || null;

  const selectedList = useMemo(() => items.filter((a) => selectedIds.has(a.id)), [items, selectedIds]);
  useEffect(() => { clear(); }, [status, clear]);

  const openPane = (a) => { clear(); setPane({ asset: a }); };
  const handleChangeStatus = guardAction(async (s) => { await setInfoAssetsStatus([...selectedIds], s); clear(); refresh(); }, 'Could not change the status');
  const handleDelete = guardAction(async () => { await deleteInfoAssets([...selectedIds]); setDeleteOpen(false); clear(); refresh(); }, 'Could not delete the asset');

  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">{counts.total} information asset{counts.total !== 1 ? 's' : ''} · {counts.active} active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button onClick={() => setPane({ asset: null })}><Plus className="w-4 h-4" /> Add Information Asset</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        <div className="mb-6"><InfoAssetSummaryCards counts={counts} /></div>
        <div className="flex items-center gap-3 mb-4">
          <CapsuleTabs animated value={status} onChange={setStatus} size="sm" tabs={STATUS_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))} />
          <div className="flex-1" />
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search information assets..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
          </div>
          <div className="relative">
            <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setFilterOpen((o) => !o)} />
            {filterOpen && <AssetFilterMenu fields={INFO_FILTER_FIELDS} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setFilterOpen(false)} />}
          </div>
          <InfoAssetExportButton items={rows} selectedItems={selectedList} registerTitle={register.title} customColumns={customColumns} />
        </div>
        {isLoading ? (
          <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load information assets" />
        ) : (
          <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
            <InfoAssetTable items={rows} customColumns={tableVisibleColumns(customColumns)} onOpen={openPane} selectedIds={selectedIds} onToggle={toggle}
              emptyText={items.length === 0 ? 'No information assets yet — add your first to start the register.' : 'No information assets found'} />
          </div>
        )}
      </div>

      <InfoAssetPane isOpen={!!pane} onClose={() => setPane(null)} register={register} asset={pane ? openAsset : null} onSaved={refresh} customColumns={customColumns} />

      <AssetCustomiserPane
        isOpen={customOpen}
        register={register}
        systemFields={false}
        entity={base44.entities.InformationAsset}
        subtitle="Manage information asset register columns"
        onClose={() => setCustomOpen(false)}
        onSaved={() => Promise.all([qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }), refresh()])}
      />

      <ConfirmTypeDialog
        isOpen={deleteOpen}
        title={selectedIds.size === 1 ? 'Delete Information Asset' : 'Delete Information Assets'}
        message={`Permanently delete ${selectedIds.size} information asset${selectedIds.size === 1 ? '' : 's'}? This cannot be recovered.`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onClose={() => setDeleteOpen(false)}
      />

      <AssetBulkBar
        count={selectedIds.size}
        statusOptions={INFO_BULK_STATUS_OPTIONS}
        onView={() => selectedList[0] && openPane(selectedList[0])}
        onChangeStatus={handleChangeStatus}
        onDelete={() => setDeleteOpen(true)}
        onClear={clear}
      />
    </div>
  );
}