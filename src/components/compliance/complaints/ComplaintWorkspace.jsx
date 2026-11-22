import React, { useState, useMemo, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, ListFilter, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AssetCustomiserPane from '@/components/compliance/assets/AssetCustomiserPane';
import { getAssetCustomColumns, tableVisibleColumns } from '@/lib/assetRegister';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import LoadError from '@/components/shared/states/LoadError';
import Pagination from '@/components/shared/Pagination';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import AssetFilterMenu from '@/components/compliance/assets/toolbar/AssetFilterMenu';
import AssetSortMenu from '@/components/compliance/assets/toolbar/AssetSortMenu';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import useRowSelectionSet from '@/hooks/useRowSelectionSet';
import { listComplaints, filterComplaints, deleteComplaints, setComplaintsStatus, complaintFilterFields, COMPLAINT_SORT_FIELDS, COMPLAINT_SYSTEM_FIELDS, getComplaintOptions } from '@/lib/complaintRegister';
import ComplaintTable from './ComplaintTable';
import ComplaintSummaryCards from './ComplaintSummaryCards';
import ComplaintPane from './ComplaintPane';
import ComplaintExportButton from './ComplaintExportButton';

const STATUS_TABS = ['Open', 'Closed'];

export default function ComplaintWorkspace({ register }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [status, setStatus] = useState('Open');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(null);
  const [menu, setMenu] = useState(null); // 'filter' | 'sort'
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [pane, setPane] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const visibleColumns = useMemo(() => tableVisibleColumns(getAssetCustomColumns(register)), [register]);
  const { selectedIds, toggle, clear } = useRowSelectionSet();

  const key = ['complaints', register.id];
  const { data: items = [], isLoading, ...read } = useQuery({ queryKey: key, queryFn: () => listComplaints(register.id) });
  const refresh = () => qc.invalidateQueries({ queryKey: key });

  const rows = useMemo(() => filterComplaints(items, { status, search, filters, sort }), [items, status, search, filters, sort]);
  const tabCounts = { Open: items.filter((c) => c.status === 'Open').length, Closed: items.filter((c) => c.status === 'Closed').length };
  const openComplaint = items.find((c) => c.id === pane?.complaint?.id) || pane?.complaint || null;
  const selectedList = items.filter((c) => selectedIds.has(c.id));
  useEffect(() => { clear(); }, [status, clear]);
  useEffect(() => { setPage(1); }, [status, search, filters, sort, pageSize]);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = rows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const openPane = (c, edit = false) => { clear(); setPane({ complaint: c, edit }); };
  const handleDelete = guardAction(async () => { await deleteComplaints([...selectedIds]); setDeleteOpen(false); clear(); refresh(); }, 'Could not delete the complaint');
  const moveStatus = guardAction(async (next) => { await setComplaintsStatus([...selectedIds], next); clear(); refresh(); }, 'Could not change the status');
  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">{items.length} complaint{items.length !== 1 ? 's' : ''} · {tabCounts.Open} open</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button onClick={() => setPane({ complaint: null })}><Plus className="w-4 h-4" /> Add Complaint</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        {!isLoading && <ComplaintSummaryCards complaints={items} />}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <CapsuleTabs animated value={status} onChange={setStatus} size="sm" tabs={STATUS_TABS.map((s) => ({ value: s, label: s, count: tabCounts[s] }))} />
          <div className="flex-1" />
          <div className="relative w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search complaints..."
              className="w-full pl-9 pr-3 h-9 border border-input bg-transparent text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 rounded-[10px]" />
          </div>
          <div className="relative">
            <ToolbarButton icon={ListFilter} label="Filter" active={!!Object.keys(filters).length} badge={<FilterCountBadge count={Object.keys(filters).length} />} onClick={() => setMenu(menu === 'filter' ? null : 'filter')} />
            {menu === 'filter' && <AssetFilterMenu fields={complaintFilterFields(register)} activeFilters={filters} onApply={applyFilter} onClear={() => setFilters({})} onClose={() => setMenu(null)} />}
          </div>
          <div className="relative">
            <ToolbarButton icon={ArrowUpDown} label="Sort" active={!!sort} onClick={() => setMenu(menu === 'sort' ? null : 'sort')} />
            {menu === 'sort' && <AssetSortMenu sort={sort} sortFields={COMPLAINT_SORT_FIELDS} onApply={setSort} onClear={() => setSort(null)} onClose={() => setMenu(null)} />}
          </div>
          <ComplaintExportButton items={items} selectedItems={selectedList} registerTitle={register.title} customColumns={visibleColumns} />
        </div>
        {isLoading ? (
          <div className="border border-border rounded-xl py-12 flex justify-center"><LoaderOne /></div>
        ) : read.isLoadingError ? (
          <LoadError failure={read} title="Couldn’t load complaints" />
        ) : (
          <>
            <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
              <ComplaintTable items={paged} onOpen={openPane} selectedIds={selectedIds} onToggle={toggle} customColumns={visibleColumns}
                emptyText={items.length === 0 ? 'No complaints yet — add your first to start the register.' : `No ${status.toLowerCase()} complaints found`} />
            </div>
            {rows.length > 0 && <Pagination page={currentPage} totalPages={totalPages} total={rows.length} pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />}
          </>
        )}
      </div>

      <ComplaintPane isOpen={!!pane} onClose={() => setPane(null)} register={register} complaint={pane ? openComplaint : null} startInEdit={!!pane?.edit} onSaved={refresh} />

      <AssetCustomiserPane isOpen={customOpen} register={register} onClose={() => setCustomOpen(false)}
        entity={base44.entities.Complaint} subtitle="Manage complaints register columns" itemNoun="complaint"
        fields={COMPLAINT_SYSTEM_FIELDS} getOptions={getComplaintOptions}
        onSaved={() => Promise.all([qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }), refresh()])} />

      <ConfirmTypeDialog isOpen={deleteOpen} title={selectedIds.size === 1 ? 'Delete Complaint' : 'Delete Complaints'}
        message={`Permanently delete ${selectedIds.size} complaint${selectedIds.size === 1 ? '' : 's'} with their actions, notes and documents? This cannot be recovered.`}
        keyword="DELETE" confirmLabel="Delete" onConfirm={handleDelete} onClose={() => setDeleteOpen(false)} />

      <AssetBulkBar
        count={pane ? 0 : selectedIds.size}
        onView={() => selectedList[0] && openPane(selectedList[0])}
        onEdit={() => selectedList[0] && openPane(selectedList[0], true)}
        onDelete={() => setDeleteOpen(true)}
        onClear={clear}
        statusOptions={[{ name: 'Open', dot: 'bg-blue-500' }, { name: 'Closed', dot: 'bg-green-500' }]}
        onChangeStatus={moveStatus}
      />
    </div>
  );
}