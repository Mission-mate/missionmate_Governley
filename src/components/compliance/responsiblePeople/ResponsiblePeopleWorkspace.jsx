import React, { useState, useEffect } from 'react';
import { guardAction } from '@/lib/saveGuard';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import useCascadeDelete from '@/hooks/useCascadeDelete';
import { deleteRegisterRecords } from '@/lib/complianceRegisters';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, UserCheck, UserMinus, SlidersHorizontal, Search } from 'lucide-react';
import ResponsiblePeopleToolbar from './ResponsiblePeopleToolbar';
import { exportPeopleToExcel, exportPeopleToPdf } from '@/lib/rpExport';
import WhsCustomiserPane from '@/components/compliance/whs/WhsCustomiserPane';
import { rpAdapter } from '@/lib/rpCustomise';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import EmptyState from '@/components/shared/states/EmptyState';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import useResponsiblePeopleSummary from './useResponsiblePeopleSummary';
import ResponsiblePersonPane from './ResponsiblePersonPane';
import ResponsiblePeopleTable from './ResponsiblePeopleTable';
import ResponsiblePeopleSummaryCards from './ResponsiblePeopleSummaryCards';
import Pagination from '@/components/shared/Pagination';

const TABS = [
  { value: 'Current', label: 'Current Committee Members', icon: UserCheck, empty: 'Current committee members will appear here.' },
  { value: 'Past', label: 'Past Committee Members', icon: UserMinus, empty: 'Past committee members will appear here.' },
];

/** Details of Responsible People workspace — Current and Past Committee Members tabs. */
export default function ResponsiblePeopleWorkspace({ register }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState('Current');
  const [adding, setAdding] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const qc = useQueryClient();
  const active = TABS.find((t) => t.value === tab);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(null); // { field, direction }
  const query = {
    register_id: register.id, status: tab, ...filters,
    ...(search.trim() && { full_name: { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }),
  };
  const sortKey = sort ? `${sort.direction === 'desc' ? '-' : ''}${sort.field}` : 'full_name';
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  useEffect(() => { setPage(1); }, [tab, search, filters, sortKey, pageSize]);
  const list = useQuery({
    queryKey: ['responsiblePeople', register.id, tab, search, filters, sortKey, page, pageSize],
    queryFn: async () => {
      const [items, total] = await Promise.all([
        base44.entities.ResponsiblePerson.filter(query, sortKey, pageSize, (page - 1) * pageSize),
        base44.entities.ResponsiblePerson.count(query),
      ]);
      return { items, total };
    },
    placeholderData: (prev) => prev,
  });
  // Data changed: refresh the table plus the register-wide summary cards and tab counts.
  const refreshAll = () => Promise.all([
    list.refetch(),
    qc.invalidateQueries({ queryKey: ['responsiblePeopleSummary', register.id] }),
    qc.invalidateQueries({ queryKey: ['responsiblePeopleCounts', register.id] }),
  ]);
  const { data: counts, isLoading: countsLoading, ...countsRead } = useQuery({
    queryKey: ['responsiblePeopleCounts', register.id],
    queryFn: () => base44.entities.ResponsiblePerson.aggregate({ query: { register_id: register.id }, groupBy: 'status' }),
  });
  const summary = useResponsiblePeopleSummary(register.id);
  // One loader for the whole workspace until cards, tab counts and table all have their first data.
  const loading = list.isLoading || countsLoading || summary.isLoading;
  // The summary cards report their own failure in place; the table and tab counts fail the workspace.
  const failure = loadFailure(list, countsRead);
  const byStatus = Object.fromEntries((counts?.rows || []).map((r) => [r.status, r.count]));
  const rows = list.data?.items || [];
  const total = list.data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const [exportFormat, setExportFormat] = useState(null);
  const runExport = async (scope) => {
    const { status, ...base } = query;
    const q = scope === 'selected' ? { register_id: register.id, id: { $in: [...selected] } }
      : scope === 'all' ? base : { ...base, status: scope };
    const label = scope === 'selected' ? 'Selected Committee Members' : scope === 'all' ? 'All Committee Members' : `${scope} Committee Members`;
    const people = await base44.entities.ResponsiblePerson.filter(q, sortKey, 1000);
    if (exportFormat === 'pdf') exportPeopleToPdf(people, register.title, label);
    else exportPeopleToExcel(people, register.title);
    setExportFormat(null);
  };
  const filtered = !!search.trim() || Object.keys(filters).length > 0;
  const [selected, setSelected] = useState(new Set());
  const [pane, setPane] = useState(null); // { record, edit }
  const [confirmDelete, setConfirmDelete] = useState(false);
  const clear = () => setSelected(new Set());
  useEffect(clear, [tab]);
  const toggle = (id) => setSelected((s) => (s.has(id) ? new Set() : new Set([id])));
  const ids = [...selected];
  const first = rows.find((r) => r.id === ids[0]);
  const open = (record, edit) => { clear(); setPane({ record, edit }); };
  const other = tab === 'Current' ? 'Past' : 'Current';
  const changeStatus = guardAction(async () => {
    await base44.entities.ResponsiblePerson.bulkUpdate(ids.map((id) => ({ id, status: other })));
    clear(); await refreshAll();
  }, 'Could not change the status');
  const del = useCascadeDelete((list) => deleteRegisterRecords('ResponsiblePerson', list), 'committee member');
  const remove = async () => {
    const failed = await del.confirm(ids);
    if (!failed.length) { setConfirmDelete(false); clear(); }
    await refreshAll();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="relative z-30 flex items-center justify-between register-gutter py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <TopBarBack onClick={() => navigate('/compliance/registers')}>Back to Register Management</TopBarBack>
          <div>
            <h1 className="text-base font-semibold text-foreground leading-tight">{register.title}</h1>
            <p className="text-xs text-muted-foreground">Register of past and present committee members</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setCustomOpen(true)}><SlidersHorizontal className="w-4 h-4" /> Customise</Button>
          <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Add Committee Member</Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto register-gutter py-5">
        {loading ? <ModuleLoader size="lg" className="py-20" /> : failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load responsible people" /> : (<div className="content-enter">
        <ResponsiblePeopleSummaryCards data={summary.data} isError={summary.isError} />
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <CapsuleTabs animated value={tab} onChange={setTab} tabs={TABS.map(({ value, label }) => ({ value, label, count: byStatus[value] }))} />
          <div className="flex-1" />
          <ResponsiblePeopleToolbar search={search} onSearch={setSearch} filters={filters} onFilters={setFilters} sort={sort} onSort={setSort}
            onExcel={() => setExportFormat('excel')} onPdf={() => setExportFormat('pdf')} />
        </div>
        {rows.length ? (<>
          <ResponsiblePeopleTable rows={rows} selectedIds={selected} onToggle={toggle} onOpen={(r) => open(r, false)} />
          <Pagination page={page} totalPages={totalPages} total={total} pageSize={pageSize} onPageChange={(p) => { clear(); setPage(p); }} onPageSizeChange={setPageSize} />
        </>) : (
          <div className="rounded-xl border border-border bg-card">
            {filtered
              ? <EmptyState icon={Search} title="No matching committee members" description="Try adjusting your search or filter." />
              : <EmptyState icon={active.icon} title={active.label} description={active.empty} />}
          </div>
        )}
        </div>)}
      </div>
      <ResponsiblePersonPane isOpen={adding} onClose={() => setAdding(false)} register={register} defaultStatus={tab} onSaved={refreshAll} />
      <ResponsiblePersonPane isOpen={!!pane} onClose={() => setPane(null)} register={register} record={pane?.record} startInEdit={pane?.edit} defaultStatus={tab} onSaved={refreshAll} />
      <WhsCustomiserPane isOpen={customOpen} register={register} adapter={rpAdapter} label="Responsible People"
        onClose={() => setCustomOpen(false)}
        onSaved={() => Promise.all([qc.invalidateQueries({ queryKey: ['complianceManagedRegister', register.id] }), refreshAll()])} />
      <AssetBulkBar
        count={pane ? 0 : selected.size}
        statusOptions={[{ name: other, dot: other === 'Current' ? 'bg-green-500' : 'bg-muted-foreground' }]}
        onView={() => open(first, false)}
        onEdit={() => open(first, true)}
        onChangeStatus={changeStatus}
        onDelete={() => setConfirmDelete(true)}
        onClear={clear}
      />
      <ExportObligationsDialog isOpen={!!exportFormat} format={exportFormat || 'pdf'} selectedCount={selected.size} statusOptions={['Current', 'Past']}
        groupLabel="status" itemLabel="committee members" onClose={() => setExportFormat(null)} onConfirm={runExport} />
      <ConfirmTypeDialog
        isOpen={confirmDelete}
        onClose={() => { setConfirmDelete(false); del.clearError(); }}
        title={ids.length > 1 ? `Delete ${ids.length} Committee Members` : 'Delete Committee Member'}
        message="This will permanently delete the selected committee member record(s), including their notes, documents and folders. This cannot be undone."
        keyword="DELETE"
        confirmLabel="Delete"
        error={del.error}
        onConfirm={remove}
      />
    </div>
  );
}