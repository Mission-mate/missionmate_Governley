import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Columns3, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SYSTEM_COLUMNS, OPTIONAL_COLUMNS, normalizeReportColumns, optionalLabel, systemLabel, visibleSystemColumnOrder, isSystemVisible } from './reportColumns';
import { buildReportTree } from './reportTree';
import ReportTable from './ReportTable';
import ReportViewSwitcher from './ReportViewSwitcher';
import Level6ReportChart from './Level6ReportChart';
import DataViewToggle from './DataViewToggle';
import ReportExportMenu from './ReportExportMenu';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import { exportReportDataToPdf, exportReportDataToExcel } from '@/lib/strategy/reportDataExport';
import { exportDashboardToPdf, exportChartsToPpt } from '@/lib/tasks/chartExport';
import ManageColumnsPane from './ManageColumnsPane';
import AddReportPeriodPane from './AddReportPeriodPane';
import DeleteReportRowDialog from './DeleteReportRowDialog';
import Level6SettingsPane from '../settings/Level6SettingsPane';
import AddColumnModal from '@/components/shared/AddColumnModal';
import Level5TaskPanel from '../../level5/tasks/Level5TaskPanel';
import TableLoading from '../../TableLoading';
import { useReportStore } from '@/lib/tasks/reportStore';
import SectionCard from '@/components/shared/SectionCard';

/**
 * Per-row reporting data panel for a Level 6 record.
 * Loads its reporting rows from the active report store (Strategy or Program).
 */
export default function Level6ReportPanel({ block, view: viewProp, onViewChange, showSwitcher = true, hideToolbar = false, readOnly = false, onTaskControls }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const store = useReportStore();
  const Report = base44.entities[store.report];
  const Parent = base44.entities[store.parent];
  const [liveBlock, setLiveBlock] = useState(block);
  const [rows, setRows] = useState(null); // null = loading
  const [config, setConfig] = useState(normalizeReportColumns(block.report_columns));
  const [manageOpen, setManageOpen] = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [periodPane, setPeriodPane] = useState(null); // { row: null } = add, { row, tab? } = edit
  const [deleteTarget, setDeleteTarget] = useState(null); // { kind, label, message, run }
  const [innerView, setInnerView] = useState(null); // 'completion' | 'count' | 'chart'
  const [dataView, setDataView] = useState('data'); // 'data' | 'charts' — sub-view of Data Reporting
  const chartRef = useRef(null);
  const controlled = viewProp !== undefined;
  const view = controlled ? viewProp : innerView;
  const setView = controlled ? (onViewChange || (() => {})) : setInnerView;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [fresh, list] = await Promise.all([
        Parent.get(block.id),
        Report.filter({ [store.scope]: block.id }, 'order_index'),
      ]);
      if (cancelled) return;
      setLiveBlock(fresh);
      setConfig(normalizeReportColumns(fresh.report_columns));
      setRows(list);
    })();
    return () => { cancelled = true; };
  }, [block]);

  const settings = useMemo(() => ({
    enabled: !!liveBlock.location_reporting_enabled,
    breakdown: liveBlock.reporting_breakdown || 'period',
    locations: liveBlock.reporting_locations || [],
  }), [liveBlock]);

  const persistConfig = async (next) => {
    setConfig(next);
    await Parent.update(block.id, { report_columns: next });
  };

  // Refresh the live block after settings change so the table regroups immediately.
  const refreshBlock = async () => {
    const fresh = await Parent.get(block.id);
    setLiveBlock(fresh);
  };

  const tracking = useMemo(() => store.tracking(liveBlock), [store, liveBlock]);
  const showCount = tracking.count;
  const showCompletion = tracking.completion;

  const tabs = useMemo(() => {
    const t = [];
    if (showCompletion) t.push({ key: 'completion', label: 'Milestones' });
    if (showCount) t.push({ key: 'count', label: 'Data' });
    return t;
  }, [showCompletion, showCount]);

  // Keep the active view valid as the tracking method changes.
  useEffect(() => {
    if (controlled) return;
    if (tabs.length === 0) { setInnerView(null); return; }
    if (!tabs.some((t) => t.key === view)) setInnerView(tabs[0].key);
  }, [tabs, view, controlled]);

  const handleAddPeriod = () => setPeriodPane({ row: null });

  // Persist a manual drag-and-drop reorder of the top-level reporting rows.
  // Location child rows inherit their parent's order so groups stay together.
  const handleReorder = async (orderedKeys) => {
    const updates = [];
    orderedKeys.forEach((id, idx) => {
      updates.push({ id, order_index: idx });
      for (const r of rows || []) if (r.parent_id === id) updates.push({ id: r.id, order_index: idx });
    });
    const map = new Map(updates.map((u) => [u.id, u.order_index]));
    setRows((rs) => rs.map((r) => (map.has(r.id) ? { ...r, order_index: map.get(r.id) } : r)));
    await Report.bulkUpdate(updates);
  };

  const periodRows = useMemo(() => (rows || []).filter((r) => !r.parent_id), [rows]);

  // Locations currently in use in the table (unique across child rows)
  const activeLocationIds = useMemo(() => {
    const s = new Set();
    for (const r of rows || []) if (r.parent_id && r.location_id) s.add(r.location_id);
    return s;
  }, [rows]);

  const existingPairs = useMemo(() => {
    const set = new Set();
    for (const r of rows || []) if (r.parent_id && r.location_id) set.add(`${r.parent_id}:${r.location_id}`);
    return set;
  }, [rows]);

  // Saves the period pane — creates a new period row (propagating location
  // children when location reporting is enabled) or updates the row being edited.
  const savePeriodPane = async (payload) => {
    if (periodPane?.row) {
      await Report.update(periodPane.row.id, payload);
      setRows((rs) => rs.map((r) => (r.id === periodPane.row.id ? { ...r, ...payload } : r)));
      return;
    }
    const created = await Report.create({ [store.scope]: block.id, ...payload });
    let newRows = [created];
    if (settings.enabled && activeLocationIds.size > 0) {
      const kids = await Report.bulkCreate(
        [...activeLocationIds].map((locId) => ({
          [store.scope]: block.id,
          parent_id: created.id,
          location_id: locId,
          order_index: payload.order_index ?? 0,
        }))
      );
      newRows = [created, ...kids];
    }
    setRows((r) => [...r, ...newRows]);
  };

  // Context label shown in the pane header when editing a location child row.
  const paneContext = useMemo(() => {
    const r = periodPane?.row;
    if (!r?.parent_id) return null;
    const loc = settings.locations.find((l) => l.id === r.location_id)?.name || 'Category';
    const parent = (rows || []).find((p) => p.id === r.parent_id);
    return parent?.period_label ? `${loc} — ${parent.period_label}` : loc;
  }, [periodPane, rows, settings]);

  // Adds a location as a child row under every existing reporting period,
  // skipping any period that already has it (duplicate prevention).
  const addLocation = async (locationId) => {
    const missing = periodRows.filter((p) => !existingPairs.has(`${p.id}:${locationId}`));
    if (missing.length === 0) return;
    const created = await Report.bulkCreate(
      missing.map((p) => ({
        [store.scope]: block.id,
        parent_id: p.id,
        location_id: locationId,
        order_index: p.order_index ?? 0,
      }))
    );
    setRows((r) => [...r, ...created]);
  };

  // Persists the managed-location list from the Settings pane and keeps the
  // reporting table in sync: newly added locations get a child row under every
  // reporting period, and removed locations have all their child rows deleted.
  const syncLocationsFromSettings = async (nextLocations, enabled = settings.enabled) => {
    const prevIds = new Set((liveBlock.reporting_locations || []).map((l) => l.id));
    const nextIds = new Set((nextLocations || []).map((l) => l.id));
    // Optimistically update the block so labels/renames reflect immediately.
    setLiveBlock((b) => ({ ...b, reporting_locations: nextLocations }));
    await Parent.update(block.id, { reporting_locations: nextLocations });

    // Only reconcile table rows while location reporting is active.
    if (enabled) {
      const added = [...nextIds].filter((id) => !prevIds.has(id));
      const removed = [...prevIds].filter((id) => !nextIds.has(id));
      for (const id of added) await addLocation(id);
      if (removed.length) {
        const removeSet = new Set(removed);
        const ids = (rows || []).filter((r) => r.parent_id && removeSet.has(r.location_id)).map((r) => r.id);
        if (ids.length) await removeIds(ids);
      }
    }
  };

  const removeIds = async (ids) => {
    await Promise.all(ids.map((id) => Report.delete(id)));
    const removed = new Set(ids);
    setRows((rs) => rs.filter((r) => !removed.has(r.id)));
  };

  // Delete a whole reporting period (and, when location reporting is on, all of
  // its location child rows). Used by the period parent/standalone rows.
  const deletePeriod = (periodRow) => {
    const childIds = (rows || []).filter((r) => r.parent_id === periodRow.id).map((r) => r.id);
    setDeleteTarget({
      kind: 'period',
      label: periodRow.period_label || 'this period',
      message: settings.enabled
        ? 'Deleting this period will remove it from all categories.'
        : 'This will permanently delete this reporting period.',
      run: () => removeIds([periodRow.id, ...childIds]),
    });
  };

  // Delete a location across every reporting period AND remove it from the
  // managed-location list, keeping the table and Manage Locations in sync.
  const deleteLocation = (locationId) => {
    const ids = (rows || []).filter((r) => r.parent_id && r.location_id === locationId).map((r) => r.id);
    const name = settings.locations.find((l) => l.id === locationId)?.name || 'this category';
    setDeleteTarget({
      kind: 'location',
      label: name,
      message: 'Deleting this category will remove it from all reporting periods and from Manage Categories.',
      run: async () => {
        if (ids.length) await removeIds(ids);
        const nextLocations = (liveBlock.reporting_locations || []).filter((l) => l.id !== locationId);
        setLiveBlock((b) => ({ ...b, reporting_locations: nextLocations }));
        await Parent.update(block.id, { reporting_locations: nextLocations });
      },
    });
  };

  // Row-level delete dispatch, aware of the current layout so deletes always
  // cascade for data consistency.
  const handleDeleteRow = (row) => {
    if (!settings.enabled) { deletePeriod(row); return; }
    if (settings.breakdown === 'location') {
      // Parents = locations, children = periods. Deleting a child period → all locations.
      if (row.parent_id) { deletePeriod((rows || []).find((r) => r.id === row.parent_id) || row); return; }
      // A standalone period row still deletes as a period.
      deletePeriod(row);
      return;
    }
    // Period layout. Parents = periods, children = locations.
    if (row.parent_id) { deleteLocation(row.location_id); return; }
    deletePeriod(row);
  };

  // Parent-row delete: period parents carry `.row`; location parents carry `.locationId`.
  const handleDeleteParent = (node) => {
    if (node.locationId) { deleteLocation(node.locationId); return; }
    if (node.row) deletePeriod(node.row);
  };

  const createColumn = async ({ title, type, config: colConfig }) => {
    const col = { id: `col_${Date.now()}`, title, type, config: colConfig || {}, visible: true };
    await persistConfig({ ...config, custom: [...config.custom, col] });
  };

  const columns = useMemo(() => {
    const optional = config.optional_order
      .filter((k) => config.optional_visible.includes(k))
      .map((k) => {
        const def = OPTIONAL_COLUMNS.find((c) => c.key === k);
        return { kind: 'optional', key: k, label: optionalLabel(config, k), tooltip: def?.tooltip, computed: def?.computed };
      });
    const custom = config.custom.filter((c) => c.visible !== false).map((c) => ({ kind: 'custom', ...c }));
    const system = visibleSystemColumnOrder(config).map((k) => {
      const def = SYSTEM_COLUMNS.find((c) => c.key === k);
      return { kind: 'system', ...def, label: systemLabel(config, k) };
    });
    return [...system, ...optional, ...custom];
  }, [config]);

  const nodes = useMemo(() => (rows ? buildReportTree(rows, settings) : []), [rows, settings]);

  // Which reporting rows have at least one note — drives the row notes icon.
  const { data: reportNotes = [] } = useQuery({
    queryKey: ['report-row-notes', block.id],
    queryFn: async () => (await base44.entities.NotePage.filter(
      { object_type: store.notesType, object_id: { $in: rows.map((r) => r.id) } },
      { distinct: 'object_id' }
    )).items,
    enabled: !!rows?.length,
  });

  const notesRowIds = useMemo(() => new Set(reportNotes), [reportNotes]);

  // Notes are edited inside the row pane — refresh the indicator when it closes.
  const closePeriodPane = () => {
    setPeriodPane(null);
    qc.invalidateQueries({ queryKey: ['report-row-notes', block.id] });
  };

  // Chart is a read-only visualisation of the Data tab — no data/column/settings actions there.
  const chartActive = view === 'chart' || (view === 'count' && dataView === 'charts');
  const showToggle = view === 'count' && !hideToolbar;
  const showActions = view !== 'completion' && !hideToolbar && !readOnly;

  const firstColLabel = settings.enabled && settings.breakdown === 'location' ? 'Category' : 'Reporting Period';

  const exportPdf = async () => {
    if (chartActive) {
      if (chartRef.current) await exportDashboardToPdf(chartRef.current, liveBlock.title || 'Data Visualisation');
      return;
    }
    exportReportDataToPdf({ nodes, columns, title: liveBlock.title || 'Data Reporting', firstColLabel, unit: tracking.unit });
  };

  const exportExcel = () =>
    exportReportDataToExcel({ nodes, columns, title: liveBlock.title || 'Data Reporting', firstColLabel, unit: tracking.unit });

  const exportPpt = async () => {
    const nodesList = [...(chartRef.current?.querySelectorAll('[data-chart-card]') || [])];
    await exportChartsToPpt(
      nodesList.map((n) => ({ node: n, title: n.getAttribute('data-chart-title') || 'Chart' })),
      liveBlock.title || 'Data Visualisation'
    );
  };

  if (tabs.length === 0) {
    return (
      <SectionCard className="text-sm text-muted-foreground">
        Tracking is not enabled for this deliverable. Open the deliverable, edit it and turn on Track Progress to choose
        a tracking and monitoring method.
      </SectionCard>
    );
  }

  return (
    <div className="space-y-3">
      <div className={cn('flex items-center justify-between gap-2 flex-wrap', !showSwitcher && !showToggle && 'justify-end', !showSwitcher && !showToggle && !showActions && 'hidden')}>
        {showSwitcher ? (
          <ReportViewSwitcher animated view={view} onChange={setView} tabs={tabs} />
        ) : showToggle ? (
          <DataViewToggle value={dataView} onChange={setDataView} />
        ) : null}
        {showActions && (
          <div className="flex items-center gap-2 flex-wrap">
            {showSwitcher && showToggle && <DataViewToggle value={dataView} onChange={setDataView} />}
            <button
              className="h-9 flex items-center gap-1.5 px-3 rounded-md border border-primary bg-primary text-primary-foreground text-sm transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
              onClick={handleAddPeriod}
              disabled={rows === null || chartActive}
            >
              <Plus className="w-3.5 h-3.5" /> Add Data
            </button>
            <ToolbarButton icon={Columns3} label="Manage Columns" onClick={() => setManageOpen(true)} disabled={chartActive} />
            <ToolbarButton icon={Settings2} label="Settings" onClick={() => setSettingsOpen(true)} disabled={chartActive} />
            <ReportExportMenu chartMode={chartActive} onPdf={exportPdf} onExcel={exportExcel} onPpt={exportPpt} />
          </div>
        )}
      </div>

      {view === 'completion' ? (
        <Level5TaskPanel block={liveBlock} readOnly={readOnly} onControls={onTaskControls} />
      ) : rows === null ? (
        <TableLoading />
      ) : chartActive ? (
        <div ref={chartRef}>
          <Level6ReportChart
            nodes={nodes}
            variant={settings.enabled && settings.breakdown === 'location' ? 'bar' : 'line'}
            direction={tracking.direction}
            showBaseline={isSystemVisible(config, 'baseline')}
          />
        </div>
      ) : (
        <ReportTable
          nodes={nodes}
          columns={columns}
          firstColLabel={firstColLabel}
          unit={tracking.unit}
          direction={tracking.direction}
          readOnly={readOnly}
          reorderable={!(settings.enabled && settings.breakdown === 'location')}
          onReorder={handleReorder}
          onViewRow={(row) => setPeriodPane({ row })}
          onEditRow={(row) => setPeriodPane({ row, editing: true })}
          onOpenNotes={(row) => setPeriodPane({ row, tab: 'notes' })}
          notesRowIds={notesRowIds}
          onDeleteRow={handleDeleteRow}
          onDeleteParent={handleDeleteParent}
        />
      )}

      <ManageColumnsPane isOpen={manageOpen} onClose={() => setManageOpen(false)} config={config} onChange={persistConfig} onAddColumn={() => setAddColOpen(true)} />
      <AddColumnModal isOpen={addColOpen} onClose={() => setAddColOpen(false)} onCreate={createColumn} overlayClassName="z-[130]" />
      <Level6SettingsPane
        block={liveBlock}
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onUpdated={refreshBlock}
        onLocationsChange={syncLocationsFromSettings}
      />
      <AddReportPeriodPane
        isOpen={periodPane !== null}
        onClose={closePeriodPane}
        initialTab={periodPane?.tab || 'overview'}
        startEditing={!!periodPane?.editing}
        block={liveBlock}
        columns={columns}
        unit={tracking.unit}
        existingRows={rows || []}
        row={periodPane?.row || null}
        contextLabel={paneContext}
        locationReporting={settings.enabled}
        onSave={savePeriodPane}
        onDelete={handleDeleteRow}
      />
      <DeleteReportRowDialog
        isOpen={deleteTarget !== null}
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget?.run()}
      />
    </div>
  );
}