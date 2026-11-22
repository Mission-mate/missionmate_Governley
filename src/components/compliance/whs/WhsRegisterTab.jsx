import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import { loadFailure } from '@/lib/readState';
import Pagination from '@/components/shared/Pagination';
import { RISK_TABLE } from '@/components/risk/riskSurfaces';
import { cn } from '@/lib/utils';
import { buildWhsQuery, STATUS_COLUMN } from '@/lib/whsTabs';
import { exportWhs } from '@/lib/whsExport';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import { WHS_CUSTOMISE, whsCustomColumns } from '@/lib/whsCustomise';
import { whsConfig } from '@/lib/whsRegister';
import { tableVisibleColumns } from '@/lib/assetRegister';
import WhsSummaryTiles from './WhsSummaryTiles';
import useWhsTileCounts from './useWhsTileCounts';
import WhsToolbar from './WhsToolbar';
import WhsTable from './WhsTable';
import WhsBulkActions from './WhsBulkActions';

export default function WhsRegisterTab({ tabKey, cfg, register, onOpenRecord, onEditRecord }) {
  const registerId = register.id;
  const [status, setStatus] = useState(cfg.statuses[0]);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState(null);
  const [sort, setSort] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [selectedIds, setSelectedIds] = useState([]);
  const [exporting, setExporting] = useState(false);
  const entity = base44.entities[cfg.entity];
  // Filters with a configKey take their values from the register's customised option list.
  const toolbarCfg = useMemo(() => {
    const config = whsConfig(register);
    return { ...cfg, filters: cfg.filters.map((f) => (f.configKey ? { ...f, values: config[f.configKey] || [] } : f)) };
  }, [cfg, register]);
  const tableColumns = useMemo(() => [
    ...cfg.columns,
    ...(WHS_CUSTOMISE[tabKey] ? tableVisibleColumns(whsCustomColumns(register, tabKey)) : [])
      .map((c) => ({ key: `cf_${c.id}`, label: c.title, kind: 'custom', column: c })),
    STATUS_COLUMN,
  ], [cfg.columns, register, tabKey]);

  useEffect(() => { const t = setTimeout(() => setDebounced(search), 300); return () => clearTimeout(t); }, [search]);

  const query = buildWhsQuery(registerId, cfg, { status, search: debounced, filters });
  const userSort = sort ? `${sort.direction === 'desc' ? '-' : ''}${sort.field}` : cfg.sort;
  // Grouped views sort by the group field so each group stays contiguous across pages.
  const sortStr = groupBy ? groupBy : userSort;
  const viewKey = JSON.stringify([query, sortStr, pageSize]);

  // Any change of view context resets to page 1 and clears the selection.
  useEffect(() => { setPage(1); setSelectedIds([]); }, [viewKey]);
  useEffect(() => { setSelectedIds([]); }, [page]);

  const list = useQuery({
    queryKey: ['whsList', tabKey, viewKey, page],
    queryFn: () => entity.filter(query, sortStr, pageSize, (page - 1) * pageSize),
    placeholderData: keepPreviousData,
  });
  const { data: matching = 0, isLoading: countLoading, ...countRead } = useQuery({ queryKey: ['whsCount', tabKey, query], queryFn: () => entity.count(query), placeholderData: keepPreviousData });
  const { data: statusRows, isLoading: statusLoading, ...statusRead } = useQuery({
    queryKey: ['whsStatusCounts', registerId, tabKey],
    queryFn: () => entity.aggregate({ query: { register_id: registerId }, groupBy: 'status' }),
  });
  const tileState = useWhsTileCounts({ tabKey, cfg, registerId, status });
  // One loader for the whole tab until every section has its first data; later refetches keep previous data.
  const loading = list.isLoading || countLoading || statusLoading || tileState.isLoading;

  const rows = list.data || [];
  const byStatus = Object.fromEntries((statusRows?.rows || []).map((r) => [r.status, r.count]));
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const tabs = cfg.statuses.map((s) => ({ value: s, label: s, count: byStatus[s] || 0 }));
  const applyFilter = (id, v) => setFilters((p) => { const n = { ...p }; if (v) n[id] = v; else delete n[id]; return n; });

  const groups = useMemo(() => {
    if (!groupBy) return [{ key: '__all__', label: null, items: rows }];
    const map = new Map();
    rows.forEach((r) => { const k = r[groupBy] || 'No value'; if (!map.has(k)) map.set(k, []); map.get(k).push(r); });
    return [...map.entries()].map(([label, items]) => ({ key: label, label, items }));
  }, [rows, groupBy]);

  const selected = rows.filter((r) => selectedIds.includes(r.id));
  // Every WHS tab is single-select.
  const toggle = (id) => setSelectedIds((p) => (p.includes(id) ? [] : [id]));
  const [exportFormat, setExportFormat] = useState(null);
  // Scope: 'all' (every status), 'selected', or a status name; search and filters still apply.
  const runExport = async (scope) => {
    const format = exportFormat;
    setExportFormat(null);
    setExporting(true);
    const { status: _s, ...base } = query;
    const scopedQuery = scope === 'all' || scope === 'selected' ? base : { ...base, status: scope };
    const statusLabel = scope === 'all' ? `All ${cfg.label}` : scope === 'selected' ? `Selected ${cfg.label}` : scope;
    await exportWhs(format, { cfg, columns: tableColumns, registerTitle: register.title, statusLabel, query: scopedQuery, sort: sortStr, selected: scope === 'selected' ? selected : null })
      .finally(() => setExporting(false));
  };
  const open = (r) => { setSelectedIds([]); onOpenRecord(r); };

  if (loading) return <ModuleLoader size="lg" className="py-20" />;
  const failure = loadFailure(list, countRead, statusRead, tileState.failure);
  if (failure.isLoadingError) return <LoadError failure={failure} title="Couldn’t load this register" />;

  return (
    <div className="content-enter">
      <div className="mb-6"><WhsSummaryTiles tiles={tileState.tiles} counts={tileState.counts} /></div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <CapsuleTabs animated value={status} onChange={setStatus} tabs={tabs} />
        <div className="flex-1" />
        <WhsToolbar cfg={toolbarCfg} search={search} onSearch={setSearch} groupBy={groupBy} onGroup={setGroupBy}
          filters={filters} onFilter={applyFilter} onClearFilters={() => setFilters({})} sort={sort} onSort={setSort}
          onExport={setExportFormat} exporting={exporting} />
      </div>
      <ExportObligationsDialog isOpen={!!exportFormat} format={exportFormat || 'pdf'} selectedCount={selected.length}
        statusOptions={cfg.statuses} groupLabel="status" itemLabel={cfg.label.toLowerCase()}
        onClose={() => setExportFormat(null)} onConfirm={runExport} />
      {rows.length === 0 ? (
        <div className={cn(RISK_TABLE, 'py-12 text-center text-muted-foreground text-sm')}>
          {total === 0 ? `No ${cfg.label.toLowerCase()} recorded yet.` : `No ${cfg.label.toLowerCase()} match your search or filters.`}
        </div>
      ) : (
        <WhsTable columns={tableColumns} groups={groups} selectedIds={selectedIds} onToggle={toggle} onOpen={open} />
      )}
      {matching > 0 && (
        <Pagination page={page} totalPages={Math.max(1, Math.ceil(matching / pageSize))} total={matching}
          pageSize={pageSize} onPageChange={setPage} onPageSizeChange={setPageSize} />
      )}
      <WhsBulkActions cfg={cfg} selected={selected} onOpen={open} onEdit={onEditRecord} onClear={() => setSelectedIds([])} />
    </div>
  );
}