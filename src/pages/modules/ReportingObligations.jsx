import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, AlertTriangle, ClipboardList, ShieldCheck } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  useGrants,
  useReportingObligations,
  REPORTING_OBLIGATIONS_QUERY_KEY,
} from '@/hooks/useGrantQueries';
import { Button } from '@/components/ui/button';
import Pagination from '@/components/shared/Pagination';
import { cn } from '@/lib/utils';
import { parseISO, isPast, isToday, differenceInDays } from 'date-fns';
import ReportingObligationsTable from '@/components/grants/reporting/ReportingObligationsTable';
import ObligationSummaryPane from '@/components/grants/reporting/ObligationSummaryPane';
import ReportingSummaryCards from '@/components/grants/reporting/ReportingSummaryCards';
import ExportToolbarMenu from '@/components/shared/export/ExportToolbarMenu';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import SortButton from '@/components/shared/SortButton';
import ExportPdfStatusDialog from '@/components/shared/export/ExportPdfStatusDialog';
import DataToolbar from '@/components/shared/table/DataToolbar';
import { fyLabel, uniqueValues, groupRecords } from '@/lib/registerGrouping';
import { exportObligationsToExcel, exportObligationsToPdf } from '@/lib/reportingExport';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import { localToday } from '@/lib/localClock';

const PDF_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'complete', label: 'Completed' },
];

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'complete', label: 'Completed' },
];

// Effective status for TAB filtering. The three lifecycle statuses are the only
// stored values, so this maps 1:1 — the fallback only covers a missing status.
// Overdue is a visual state, never a tab.
function computeEffectiveStatus(o) {
  return o.status || 'not_started';
}

// An obligation is overdue when it's past its due date and not complete.
function isObligationOverdue(o) {
  if (o.status === 'complete') return false;
  if (!o.due_date) return false;
  const due = parseISO(o.due_date);
  return isPast(due) && !isToday(due);
}

export default function ReportingObligations() {
  const qc = useQueryClient();
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [summaryModal, setSummaryModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState(null);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState(null);
  const [filters, setFilters] = useState({});

  const { data: obligations = [], isLoading: loadingObs, ...obligationsRead } = useReportingObligations();
  const { data: grants = [], isLoading: loadingGrants, ...grantsRead } = useGrants();
  const failure = loadFailure(obligationsRead, grantsRead);
  // The table's grant columns and the provider filter both depend on grants,
  // so every gate on this page waits for both queries.
  const configLoading = loadingObs || loadingGrants;

  // Only obligations of Active grants are monitored here — obligations of
  // Closed/Archived grants stay visible inside the grant itself and keep
  // their own status, reappearing here if the grant returns to Active.
  const activeGrantIds = useMemo(
    () => new Set(grants.filter(g => g.status === 'active').map(g => g.id)),
    [grants]
  );
  const isMonitored = (o) => activeGrantIds.has(o.grant_id);

  const refresh = () => qc.invalidateQueries({ queryKey: REPORTING_OBLIGATIONS_QUERY_KEY });

  // Real-time: refresh summary cards + table whenever any obligation changes.
  useEffect(() => {
    const unsubscribe = base44.entities.ReportingObligation.subscribe(() => {
      qc.invalidateQueries({ queryKey: REPORTING_OBLIGATIONS_QUERY_KEY });
    });
    return unsubscribe;
  }, [qc]);

  const today = parseISO(localToday());
  const in30Days = new Date(today); in30Days.setDate(in30Days.getDate() + 30);

  // Monitored obligations (exclude archived obligations and obligations of archived grants)
  const activeObs = obligations.filter(isMonitored);

  const dueSoonObs = activeObs.filter(o => {
    if (!o.due_date || o.status === 'complete') return false;
    const d = parseISO(o.due_date);
    return d >= today && d <= in30Days;
  });

  const overdueObs = activeObs.filter(isObligationOverdue);

  const inProgressObs = activeObs.filter(o => o.status === 'in_progress');

  const notStartedObs = activeObs.filter(o => computeEffectiveStatus(o) === 'not_started');

  const overdue = overdueObs.length;

  // Tab counts
  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab.id] = tab.id === 'all' ?
      activeObs.length :
      activeObs.filter(o => computeEffectiveStatus(o) === tab.id).length;
    return acc;
  }, {});

  const baseFilteredObligations = activeTab === 'all' ?
    activeObs :
    activeObs.filter(o => computeEffectiveStatus(o) === activeTab);

  // Single O(1) lookup index — rebuilt only when the grants dataset changes.
  const grantMap = useMemo(() => new Map(grants.map(g => [g.id, g])), [grants]);

  const getters = useMemo(() => ({
    financial_year: (o) => fyLabel(o.due_date),
    provider: (o) => grantMap.get(o.grant_id)?.provider || '',
  }), [grantMap]);

  const toolbarFields = useMemo(() => [
    { key: 'financial_year', label: 'Financial Year', values: uniqueValues(baseFilteredObligations, getters.financial_year) },
    { key: 'provider', label: 'Grant Provider', values: uniqueValues(baseFilteredObligations, getters.provider) },
  ], [baseFilteredObligations, getters]);

  const searchedObligations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseFilteredObligations.filter(o => {
      if (q) {
        const grantName = grantMap.get(o.grant_id)?.name || '';
        const hay = [o.title, o.reporting_type, grantName, getters.provider(o)];
        if (!hay.some(v => (v || '').toLowerCase().includes(q))) return false;
      }
      return Object.entries(filters).every(([key, val]) => !val || getters[key](o) === val);
    });
  }, [baseFilteredObligations, search, filters, getters, grantMap]);

  const filteredObligations = useMemo(() => {
    if (!sort) return searchedObligations;
    return [...searchedObligations].sort((a, b) => {
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [searchedObligations, sort]);

  const groups = useMemo(
    () => (groupBy ? groupRecords(filteredObligations, getters[groupBy]) : null),
    [groupBy, filteredObligations, getters]
  );

  useEffect(() => { setPage(1); }, [activeTab, pageSize, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredObligations.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedObligations = filteredObligations.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleConfirmPdf = (selectedStatuses) => {
    setShowPdfDialog(false);
    let subset = activeObs;
    let scope = 'All obligations';
    if (selectedStatuses && selectedStatuses.length > 0) {
      subset = activeObs.filter(o => selectedStatuses.includes(computeEffectiveStatus(o)));
      scope = selectedStatuses.map(s => PDF_STATUS_OPTIONS.find(o => o.value === s)?.label || s).join(', ');
    }
    exportObligationsToPdf(subset, grants, { scope });
  };

  const handleConfirmExcel = (selectedStatuses) => {
    setShowExcelDialog(false);
    let subset = activeObs;
    if (selectedStatuses && selectedStatuses.length > 0) {
      subset = activeObs.filter(o => selectedStatuses.includes(computeEffectiveStatus(o)));
    }
    exportObligationsToExcel(subset, grants);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reporting Obligations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track upcoming, overdue and completed grant acquittals across all active grants.</p>
        </div>
      </div>

      {configLoading ? <ModuleLoader fullPage /> : failure.isLoadingError ? <LoadError failure={failure} title="Couldn’t load reporting obligations" /> : <>
      {/* Summary Cards */}
      <ReportingSummaryCards
        notStartedCount={notStartedObs.length}
        overdue={overdue}
        inProgressCount={inProgressObs.length}
        onActive={() => setSummaryModal({ title: 'Not Started Obligations', obligations: notStartedObs })}
        onOverdue={() => setSummaryModal({ title: 'Overdue Obligations', obligations: overdueObs })}
        onInProgress={() => setSummaryModal({ title: 'In Progress Obligations', obligations: inProgressObs })}
        onCompliance={() => setSummaryModal({ title: 'Overdue (At Risk)', obligations: overdueObs })}
      />

      {/* Tabs + Sort (outside the table wrap) */}
      <div className="flex items-center justify-between gap-3 mt-6 mb-3">
          <CapsuleTabs animated
            tabs={STATUS_TABS.map(t => ({ value: t.id, label: t.label, count: tabCounts[t.id] }))}
            value={activeTab}
            onChange={setActiveTab}
          />
          <div className="flex items-center gap-2">
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
            <SortButton
              fields={[{ key: 'due_date', label: 'Due Date' }]}
              value={sort}
              onChange={setSort}
            />
            <ExportToolbarMenu onExportExcel={() => setShowExcelDialog(true)} onExportPdf={() => setShowPdfDialog(true)} />
          </div>
      </div>

      {/* Table */}
      {groups ? (
        <ReportingObligationsTable
          obligations={filteredObligations}
          groups={groups}
          grants={grants}
          isLoading={false}
          onRefresh={refresh}
        />
      ) : (
      <>
      <div className="border border-border rounded-xl bg-white overflow-hidden">
        <ReportingObligationsTable
          obligations={pagedObligations}
          grants={grants}
          isLoading={loadingObs}
          onRefresh={refresh}
        />
      </div>

      {!loadingObs && filteredObligations.length > 0 && (
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filteredObligations.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
      </>
      )}
      </>}

      <ExportPdfStatusDialog
        isOpen={showPdfDialog}
        onClose={() => setShowPdfDialog(false)}
        onConfirm={handleConfirmPdf}
        allLabel="All reporting obligations"
        description="Choose which reporting obligations to include in the PDF."
        statusOptions={PDF_STATUS_OPTIONS}
      />

      <ExportPdfStatusDialog
        variant="excel"
        isOpen={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        onConfirm={handleConfirmExcel}
        allLabel="All reporting obligations"
        description="Choose which reporting obligations to include in the Excel file."
        statusOptions={PDF_STATUS_OPTIONS}
      />

      {/* Summary detail right pane */}
      <ObligationSummaryPane
        summary={summaryModal}
        grants={grants}
        onClose={() => setSummaryModal(null)}
      />
    </div>
  );
}