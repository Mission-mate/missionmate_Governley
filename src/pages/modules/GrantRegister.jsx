import React, { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useGrants, GRANTS_QUERY_KEY } from '@/hooks/useGrantQueries';
import Pagination from '@/components/shared/Pagination';
import GrantTable from '@/components/grants/GrantTable';
import AddGrantModal from '@/components/grants/AddGrantModal';
import GrantSummaryCards from '@/components/grants/GrantSummaryCards';
import ExportToolbarMenu from '@/components/shared/export/ExportToolbarMenu';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import SortButton from '@/components/shared/SortButton';
import ExportPdfStatusDialog from '@/components/shared/export/ExportPdfStatusDialog';
import DataToolbar from '@/components/shared/table/DataToolbar';
import { fyLabel, uniqueValues, groupRecords } from '@/lib/registerGrouping';
import { exportGrantsToExcel, exportGrantsToPdf } from '@/lib/grantExport';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';

const GETTERS = {
  financial_year: (g) => fyLabel(g.start_date),
  provider: (g) => g.provider,
  program: (g) => g.program
};

const PDF_STATUS_OPTIONS = [
{ value: 'active', label: 'Active' },
{ value: 'closed', label: 'Closed' },
{ value: 'archived', label: 'Archived' }];

const TABS = [
{ id: 'active', label: 'Active' },
{ id: 'closed', label: 'Closed' },
{ id: 'archived', label: 'Archived' }];


export default function GrantRegister() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [showExcelDialog, setShowExcelDialog] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [sort, setSort] = useState(null);
  const [search, setSearch] = useState('');
  const [groupBy, setGroupBy] = useState(null);
  const [filters, setFilters] = useState({});

  const { data: grants = [], isLoading, ...read } = useGrants();

  const invalidate = () => qc.invalidateQueries({ queryKey: GRANTS_QUERY_KEY });

  // Archived grants are excluded from the default export subset.
  const liveGrants = useMemo(() => grants.filter((g) => g.status !== 'archived'), [grants]);

  const tabCounts = TABS.reduce((acc, tab) => {
    acc[tab.id] = grants.filter((g) => g.status === tab.id).length;
    return acc;
  }, {});

  const baseFilteredGrants = useMemo(
    () => grants.filter((g) => g.status === activeTab),
    [grants, activeTab]
  );

  const toolbarFields = useMemo(() => [
    { key: 'financial_year', label: 'Financial Year', values: uniqueValues(baseFilteredGrants, GETTERS.financial_year) },
    { key: 'provider', label: 'Grant Provider', values: uniqueValues(baseFilteredGrants, GETTERS.provider) },
    { key: 'program', label: 'Grant Program', values: uniqueValues(baseFilteredGrants, GETTERS.program) }],
  [baseFilteredGrants]);

  const searchedGrants = useMemo(() => {
    const q = search.trim().toLowerCase();
    return baseFilteredGrants.filter((g) => {
      if (q && ![g.name, g.reference_id, g.provider, g.program].some((v) => (v || '').toLowerCase().includes(q))) return false;
      return Object.entries(filters).every(([key, val]) => !val || GETTERS[key](g) === val);
    });
  }, [baseFilteredGrants, search, filters]);

  const filteredGrants = useMemo(() => {
    if (!sort) return searchedGrants;
    return [...searchedGrants].sort((a, b) => {
      const av = a[sort.key] || '';
      const bv = b[sort.key] || '';
      if (av === bv) return 0;
      const cmp = av < bv ? -1 : 1;
      return sort.direction === 'asc' ? cmp : -cmp;
    });
  }, [searchedGrants, sort]);

  const groups = useMemo(
    () => (groupBy ? groupRecords(filteredGrants, GETTERS[groupBy]) : null),
    [groupBy, filteredGrants]
  );

  useEffect(() => {setPage(1);}, [activeTab, pageSize, search, filters]);

  const totalPages = Math.max(1, Math.ceil(filteredGrants.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedGrants = filteredGrants.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleConfirmPdf = (selectedStatuses) => {
    setShowPdfDialog(false);
    let subset = liveGrants;
    let scope = 'All grants';
    if (selectedStatuses && selectedStatuses.length > 0) {
      subset = grants.filter((g) => selectedStatuses.includes(g.status));
      scope = `${selectedStatuses.map((s) => PDF_STATUS_OPTIONS.find((o) => o.value === s)?.label || s).join(', ')} grants`;
    }
    exportGrantsToPdf(subset, { scope });
  };

  const handleConfirmExcel = (selectedStatuses) => {
    setShowExcelDialog(false);
    let subset = liveGrants;
    if (selectedStatuses && selectedStatuses.length > 0) {
      subset = grants.filter((g) => selectedStatuses.includes(g.status));
    }
    exportGrantsToExcel(subset);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Grant Register</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            View and manage your <span className="text-[hsl(var(--muted-foreground))]">entire grant portfolio.</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5 h-9 text-sm" onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" /> Add New Grant
          </Button>
        </div>
      </div>

      {isLoading ? <ModuleLoader fullPage /> : read.isLoadingError ? <LoadError failure={read} title="Couldn’t load grants" /> : <>
      {/* Summary Cards */}
      <GrantSummaryCards grants={baseFilteredGrants} />

      {/* Tabs + Sort (outside the table wrap) */}
      <div className="flex items-center justify-between gap-3 mt-6 mb-3">
        <CapsuleTabs animated
          tabs={TABS.map((t) => ({ value: t.id, label: t.label, count: tabCounts[t.id] }))}
          value={activeTab}
          onChange={setActiveTab} />
        <div className="flex items-center gap-2">
          <DataToolbar
            search={search}
            onSearchChange={setSearch}
            placeholder="Search grants..."
            fields={toolbarFields}
            groupBy={groupBy}
            onGroupBy={setGroupBy}
            filters={filters}
            onFilterChange={(key, val) => setFilters((p) => ({ ...p, [key]: val }))}
            onClearFilters={() => setFilters({})} />
          <SortButton
            fields={[
            { key: 'start_date', label: 'Start Date' },
            { key: 'end_date', label: 'End Date' }]}
            value={sort}
            onChange={setSort} />
          <ExportToolbarMenu onExportExcel={() => setShowExcelDialog(true)} onExportPdf={() => setShowPdfDialog(true)} />
        </div>
      </div>

      {/* Table */}
      {groups ?
      <GrantTable grants={filteredGrants} groups={groups} isLoading={false} onRefresh={invalidate} /> :

      <>
      <div className="border border-border rounded-xl bg-white overflow-hidden">
        <GrantTable
          grants={pagedGrants}
          isLoading={isLoading}
          onRefresh={invalidate} />
      </div>

      {!isLoading && filteredGrants.length > 0 &&
        <Pagination
          page={currentPage}
          totalPages={totalPages}
          total={filteredGrants.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize} />
      }
      </>
      }
      </>}

      <AddGrantModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSaved={() => {invalidate();setShowAddModal(false);}} />

      <ExportPdfStatusDialog
        isOpen={showPdfDialog}
        onClose={() => setShowPdfDialog(false)}
        onConfirm={handleConfirmPdf}
        allLabel="All grants"
        description="Choose which grants to include in the PDF."
        statusOptions={PDF_STATUS_OPTIONS} />

      <ExportPdfStatusDialog
        variant="excel"
        isOpen={showExcelDialog}
        onClose={() => setShowExcelDialog(false)}
        onConfirm={handleConfirmExcel}
        allLabel="All grants"
        description="Choose which grants to include in the Excel file."
        statusOptions={PDF_STATUS_OPTIONS} />

    </div>);

}