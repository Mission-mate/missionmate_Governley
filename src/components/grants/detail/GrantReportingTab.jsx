import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOOLBAR_SEARCH_INPUT } from '@/components/shared/table/ToolbarButton';
import { AnimatePresence } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import ReportingObligationPane from './ReportingObligationPane';
import DeleteObligationDialog from './DeleteObligationDialog';
import GrantObligationsTable from './GrantObligationsTable';
import GrantObligationBulkBar from './GrantObligationBulkBar';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import SortButton from '@/components/shared/SortButton';
import DataToolbar from '@/components/shared/table/DataToolbar';
import ExportToolbarMenu from '@/components/shared/export/ExportToolbarMenu';
import ExportPdfStatusDialog from '@/components/shared/export/ExportPdfStatusDialog';
import Pagination from '@/components/shared/Pagination';
import { fyLabel, uniqueValues, groupRecords } from '@/lib/registerGrouping';
import { exportObligationsToExcel, exportObligationsToPdf } from '@/lib/reportingExport';
import { GRANT_OBLIGATIONS } from '@/lib/obligationSources';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Completed' },
];

const PDF_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Completed' },
];

const statusKeyOf = (ob) => ob.status || 'not_started';

export default function GrantReportingTab({
  grant, obligations, currentUser, onRefresh, isLoading = false, failure,
  source = GRANT_OBLIGATIONS, parentId = grant?.id, parentExtra,
  exportParents = grant ? [grant] : [], exportScope = grant?.name || 'Grant obligations',
}) {
  const entity = base44.entities[source.entity];
  const exportOpts = { parentField: source.parentField, parentLabel: source.parentLabel, providerLabel: source.providerLabel };
  const { toast } = useToast();
  const [paneObligation, setPaneObligation] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState([]);
  const [sort, setSort] = useState(null);
  const [statusTab, setStatusTab] = useState('all');
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState(null);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);

  // Deep link (?obligation=<id>) opens that obligation's view-only pane once, then drops the param.
  const [searchParams, setSearchParams] = useSearchParams();
  const linkedId = searchParams.get('obligation');
  useEffect(() => {
    if (!linkedId || isLoading) return;
    const ob = obligations.find((o) => o.id === linkedId);
    if (ob) setPaneObligation({ obligation: ob, readOnly: true });
    setSearchParams((prev) => { const next = new URLSearchParams(prev); next.delete('obligation'); return next; }, { replace: true });
  }, [linkedId, isLoading, obligations, setSearchParams]);

  const tabCounts = STATUS_TABS.reduce((acc, t) => {
    acc[t.value] = t.value === 'all' ? obligations.length : obligations.filter(o => statusKeyOf(o) === t.value).length;
    return acc;
  }, {});

  const byTab = statusTab === 'all' ? obligations : obligations.filter(o => statusKeyOf(o) === statusTab);

  const getters = useMemo(() => ({
    financial_year: (o) => fyLabel(o.due_date),
    reporting_type: (o) => o.reporting_type || '',
  }), []);

  const toolbarFields = useMemo(() => [
    { key: 'financial_year', label: 'Financial Year', values: uniqueValues(byTab, getters.financial_year) },
    { key: 'reporting_type', label: 'Reporting Type', values: uniqueValues(byTab, getters.reporting_type) },
  ], [byTab, getters]);

  const searched = useMemo(() => {
    const q = search.trim().toLowerCase();
    return byTab.filter(o => {
      if (q && ![o.title, o.reporting_type].some(v => (v || '').toLowerCase().includes(q))) return false;
      return Object.entries(filters).every(([key, val]) => !val || getters[key](o) === val);
    });
  }, [byTab, search, filters, getters]);

  const filtered = useMemo(() => {
    if (!sort) return searched;
    return [...searched].sort((a, b) => {
      const da = new Date(a.due_date || 0);
      const db = new Date(b.due_date || 0);
      return sort.direction === 'asc' ? da - db : db - da;
    });
  }, [searched, sort]);

  const groups = useMemo(
    () => (groupBy ? groupRecords(filtered, getters[groupBy]) : null),
    [groupBy, filtered, getters]
  );

  useEffect(() => { setPage(1); }, [statusTab, pageSize, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const visibleRows = groups ? filtered : paged;
  const toggleOne = (id) => setSelected(prev => prev.includes(id) ? [] : [id]);

  const selectedObligations = obligations.filter(o => selected.includes(o.id));

  // Bulk ops are per-record, so a single failure must not discard the successes.
  // allSettled lets us refetch once, report exact counts, and keep only the
  // failed rows selected so the user can retry them straight from the bulk bar.
  const runBulk = async (ids, op, verb) => {
    if (bulkProcessing) return;
    setBulkProcessing(true);
    try {
      const results = await Promise.allSettled(ids.map(op));
      const succeededIds = ids.filter((_, i) => results[i].status === 'fulfilled');
      const failedIds = ids.filter((_, i) => results[i].status === 'rejected');
      onRefresh();
      setSelected(failedIds);
      if (failedIds.length === 0) {
        toast({ title: `${verb} ${succeededIds.length} obligation${succeededIds.length === 1 ? '' : 's'}` });
      } else if (succeededIds.length > 0) {
        toast({
          title: 'Partially completed',
          description: `${verb} ${succeededIds.length} of ${ids.length}. ${failedIds.length} failed — still selected for retry.`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: `Failed to ${verb.toLowerCase()} ${failedIds.length} obligation${failedIds.length === 1 ? '' : 's'}.`,
          variant: 'destructive',
        });
      }
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleStatusChange = (status) =>
    runBulk(selected, (id) => entity.update(id, { status }), 'Updated');

  const handleDelete = async () => {
    const ids = selected;
    await runBulk(ids, (id) => entity.delete(id), 'Deleted');
    setDeleteOpen(false);
  };

  const exportSubset = (statuses) => (
    statuses && statuses.length > 0 ? obligations.filter(o => statuses.includes(statusKeyOf(o))) : obligations
  );

  const table = (rows, rowGroups) => (
    <GrantObligationsTable
      obligations={rows}
      groups={rowGroups}
      emptyText={obligations.length === 0 && source.emptyText ? source.emptyText : undefined}
      selected={selected}
      onToggleOne={toggleOne}
      onOpen={(ob) => { setSelected([]); setPaneObligation({ obligation: ob, readOnly: true }); }}
    />
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">{source.heading}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{source.subheading}</p>
        </div>
        <Button size="sm" className="h-9 px-4 text-sm font-medium gap-1.5 bg-primary text-white" onClick={() => setPaneObligation({ obligation: null, readOnly: false })}>
          <Plus className="w-4 h-4" /> Add Obligation
        </Button>
      </div>

      {/* Tabs + toolbar */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <CapsuleTabs animated
          tabs={STATUS_TABS.map(t => ({ ...t, count: tabCounts[t.value] }))}
          value={statusTab}
          onChange={setStatusTab}
        />
        <div className="flex items-center gap-2">
          {source.searchOnlyToolbar ? (
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search obligations..." className={cn(TOOLBAR_SEARCH_INPUT, 'w-56')} />
            </div>
          ) : (
            <>
              <DataToolbar
                search={search}
                onSearchChange={setSearch}
                placeholder="Search obligations..."
                fields={toolbarFields}
                groupBy={groupBy}
                onGroupBy={setGroupBy}
                filters={filters}
                onFilterChange={(key, val) => setFilters(p => ({ ...p, [key]: val }))}
                onClearFilters={() => setFilters({})}
              />
              <SortButton fields={[{ key: 'due_date', label: 'Due Date' }]} value={sort} onChange={setSort} />
            </>
          )}
          <ExportToolbarMenu onExportExcel={() => setShowExcelDialog(true)} onExportPdf={() => setShowPdfDialog(true)} />
        </div>
      </div>

      {isLoading ? (
        <div className="border border-border rounded-xl bg-white overflow-hidden">
          <ModuleLoader />
        </div>
      ) : failure?.isLoadingError ? (
        <LoadError failure={failure} title="Couldn’t load obligations" />
      ) : groups ? (
        table(filtered, groups)
      ) : (
        <>
          <div className="border border-border rounded-xl bg-white overflow-hidden">
            {table(paged)}
          </div>
          {filtered.length > 0 && (
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              total={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </>
      )}

      {(
        <GrantObligationBulkBar
          count={selected.length}
          processing={bulkProcessing}
          onView={() => setPaneObligation({ obligation: selectedObligations[0], readOnly: true })}
          onEdit={() => setPaneObligation({ obligation: selectedObligations[0], readOnly: false })}
          onStatusChange={handleStatusChange}
          onDelete={() => setDeleteOpen(true)}
          onClear={() => setSelected([])}
        />
      )}

      <AnimatePresence>
      {paneObligation && (
        <ReportingObligationPane
          key="reporting-obligation-pane"
          source={source}
          parentId={parentId}
          parentExtra={parentExtra}
          obligation={paneObligation.obligation}
          currentUser={currentUser}
          readOnly={paneObligation.readOnly}
          onClose={() => setPaneObligation(null)}
          onSaved={onRefresh}
        />
      )}
      </AnimatePresence>

      <ExportPdfStatusDialog
        isOpen={showPdfDialog}
        onClose={() => setShowPdfDialog(false)}
        onConfirm={(statuses) => {
          setShowPdfDialog(false);
          exportObligationsToPdf(exportSubset(statuses), exportParents, { scope: exportScope, options: exportOpts });
        }}
        allLabel="All reporting obligations"
        description="Choose which reporting obligations to include in the PDF."
        statusOptions={PDF_STATUS_OPTIONS}
      />

      <ExportPdfStatusDialog
        variant="excel"
        isOpen={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        onConfirm={(statuses) => {
          setShowExcelDialog(false);
          exportObligationsToExcel(exportSubset(statuses), exportParents, exportOpts);
        }}
        allLabel="All reporting obligations"
        description="Choose which reporting obligations to include in the Excel file."
        statusOptions={PDF_STATUS_OPTIONS}
      />

      <DeleteObligationDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title={selected.length === 1 ? selectedObligations[0]?.title : `${selected.length} obligations`}
      />
    </div>
  );
}