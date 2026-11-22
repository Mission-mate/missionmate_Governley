import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { level5TaskCountKey } from '@/hooks/useRecordTabCounts';
import { cn } from '@/lib/utils';
import { normalizeTaskColumns, builtinColumn, visibleBuiltinKeys } from './taskColumns';
import TaskTable from './TaskTable';
import ManageTaskColumnsPane from './ManageTaskColumnsPane';
import EditTaskColumnModal from './EditTaskColumnModal';
import TaskDetailPane from './TaskDetailPane';
import DeleteTaskDialog from './DeleteTaskDialog';
import AddColumnModal from '@/components/shared/AddColumnModal';
import TableLoading from '../../TableLoading';
import TaskToolbar from './TaskToolbar';
import TaskHeaderActions from './TaskHeaderActions';
import TaskActionBar from './TaskActionBar';
import { OPTION_COLORS } from '@/lib/registerColors';
import TaskStatusTabs from './TaskStatusTabs';
import TaskSummaryTiles from './charts/TaskSummaryTiles';
import { setTaskSubtasksCompleted, deleteSubtasksOfTask } from '@/lib/strategySubtasks';
import { checklistKey } from '@/lib/tasks/taskStore';
import { deleteAllWhere } from '@/lib/cascadeDelete';
import { useTaskStore } from '@/lib/tasks/taskStore';
import TaskViewToggle from './TaskViewToggle';
import TaskChartsView from './charts/TaskChartsView';
import { buildTaskView, flattenTaskRows } from '@/lib/tasks/taskView';
import { exportTasksToPdf, exportTasksToExcel } from '@/lib/tasks/taskExport';
import { exportDashboardToPdf, exportChartsToPpt } from '@/lib/tasks/chartExport';

/**
 * Per-record Tasks panel for a Level 5 row.
 * Lazy-loads its Level5Task rows only when the row is expanded.
 */
export default function Level5TaskPanel({ block, onStats, readOnly = false, onControls }) {
  const store = useTaskStore();
  const Entity = base44.entities[store.task];
  const Parent = base44.entities[store.parent];
  const [tasks, setTasks] = useState(null); // null = loading
  const [config, setConfig] = useState(() => normalizeTaskColumns(block.task_columns));
  const [manageOpen, setManageOpen] = useState(false);
  const [addColOpen, setAddColOpen] = useState(false);
  const [editColumn, setEditColumn] = useState(null);
  const [openTaskId, setOpenTaskId] = useState(null);
  const [draft, setDraft] = useState(null); // unsaved new task shown in the pane
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filters, setFilters] = useState({});
  const [groupBy, setGroupBy] = useState('');
  const [sort, setSort] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [moving, setMoving] = useState(false);
  const [collapsedIds, setCollapsedIds] = useState(() => new Set()); // UI-only, per page session
  const exportRefs = useRef({ dashboard: null, velocity: null, quarterly: null });
  const qc = useQueryClient();
  const clearSelection = () => { setSelectedId(null); setMoving(false); };

  // Any view change drops the selection and leaves drag mode.
  useEffect(() => { clearSelection(); }, [status, groupBy, filters, sort, viewMode]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await Entity.filter({ [store.scope]: block.id }, 'order_index');
      if (!cancelled) setTasks(list);
    })();
    return () => { cancelled = true; };
  }, [block.id]);

  // Roll task completion up to the block: stats callback + persisted Progress %.
  useEffect(() => {
    if (!tasks) return;
    const parents = tasks.filter((t) => t.type !== 'section');
    const completed = parents.filter((t) => t.completed).length;
    onStats?.({ total: parents.length, completed });
    // Keep the Tasks & Milestones badge in step with the rows this panel already holds.
    qc.setQueryData(level5TaskCountKey(block.id), parents.length);
    const progress = parents.length ? Math.round((completed / parents.length) * 100) : 0;
    if ((block.progress ?? null) !== progress) {
      Parent.update(block.id, { progress });
    }
  }, [tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  const topLevelTasks = useMemo(
    () => (tasks || []).filter((t) => t.type !== 'section'),
    [tasks]
  );

  // Let a parent (e.g. the deliverable page tab bar) render the Add Task / Manage Columns controls.
  useEffect(() => {
    if (!onControls) return undefined;
    onControls({ addTask: (type) => newDraft(type), manageColumns: () => setManageOpen(true) });
    return () => onControls(null);
  }, [onControls]); // eslint-disable-line react-hooks/exhaustive-deps

  const persistConfig = async (next) => {
    setConfig(next);
    await Parent.update(block.id, { task_columns: next });
  };

  const columns = useMemo(() => {
    const builtins = visibleBuiltinKeys(config)
      .map((k) => builtinColumn(config, k))
      .filter(Boolean);
    const custom = config.custom.filter((c) => c.visible !== false).map((c) => ({ kind: 'custom', ...c }));
    return [...builtins, ...custom];
  }, [config]);

  const newDraft = (type) =>
    setDraft({ id: null, [store.scope]: block.id, section_id: '', type, title: '', custom_values: {} });

  // Create a top-level task / milestone / section from the pane draft — nothing is saved until this runs.
  const createTask = async (payload) => {
    const type = draft?.type || 'task';
    const siblings = (tasks || []).filter((t) =>
      type === 'section' ? t.type === 'section' : t.type !== 'section' && !t.section_id
    );
    const created = await Entity.create({
      [store.scope]: block.id,
      section_id: '',
      type,
      order_index: siblings.length,
      ...payload,
    });
    setTasks((t) => [...(t || []), created]);
    setDraft(null);
  };

  // Saving a task whose completion changes cascades to its subtasks (complete all / reopen completed ones).
  const saveTask = async (id, payload) => {
    const prev = tasks.find((t) => t.id === id);
    await Entity.update(id, payload);
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, ...payload } : t)));
    if (prev && prev.type !== 'section' && 'completed' in payload && !!payload.completed !== !!prev.completed) {
      await setTaskSubtasksCompleted(store, id, !!payload.completed);
      qc.invalidateQueries({ queryKey: checklistKey(store, id) });
    }
  };

  // Subtask roll-up: the task follows "all subtasks complete" — written only when it actually changes, no cascade back.
  const syncFromSubtasks = async (task, allDone) => {
    const current = tasks.find((t) => t.id === task.id);
    if (!current || !!current.completed === allDone) return;
    const patch = allDone
      ? { completed: true, status: 'Completed', progress: 100 }
      : { completed: false, ...(current.status === 'Completed' ? { status: 'In Progress' } : {}) };
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    await Entity.update(task.id, patch);
  };

  // Reorder top-level tasks within a group (section id, or '' for ungrouped).
  const reorderTasks = async (orderedParents, sectionId = '') => {
    setTasks((ts) => {
      const map = new Map(orderedParents.map((p, i) => [p.id, i]));
      return ts.map((t) => (map.has(t.id) ? { ...t, order_index: map.get(t.id), section_id: sectionId } : t));
    });
    if (!orderedParents.length) return;
    await Entity.bulkUpdate(
      orderedParents.map((p, i) => ({ id: p.id, order_index: i, section_id: sectionId }))
    );
  };

  const reorderSections = async (orderedSections) => {
    setTasks((ts) => {
      const map = new Map(orderedSections.map((s, i) => [s.id, i]));
      return ts.map((t) => (map.has(t.id) ? { ...t, order_index: map.get(t.id) } : t));
    });
    await Entity.bulkUpdate(orderedSections.map((s, i) => ({ id: s.id, order_index: i })));
  };

  // Deletion cascades to the task's subtasks and note pages.
  const confirmDelete = async () => {
    const task = deleteTarget;
    // Deleting a section only removes the grouping — its tasks move back to the ungrouped list.
    if (task.type === 'section') {
      const grouped = tasks.filter((t) => t.section_id === task.id);
      await Entity.delete(task.id);
      if (grouped.length) {
        await Entity.bulkUpdate(grouped.map((t) => ({ id: t.id, section_id: '' })));
      }
      setTasks((ts) => ts.filter((t) => t.id !== task.id).map((t) => (t.section_id === task.id ? { ...t, section_id: '' } : t)));
      if (openTaskId === task.id) setOpenTaskId(null);
      setDeleteTarget(null);
      return;
    }
    await Promise.all([
      Entity.delete(task.id),
      deleteSubtasksOfTask(store, task.id),
      deleteAllWhere('NotePage', { object_type: store.notesType, object_id: task.id }),
    ]);
    setTasks((ts) => ts.filter((t) => t.id !== task.id));
    if (openTaskId === task.id) setOpenTaskId(null);
    setDeleteTarget(null);
  };

  const createColumn = async ({ title, type, config: colConfig }) => {
    const col = { id: `col_${crypto.randomUUID()}`, title, type, config: colConfig || {}, visible: true };
    await persistConfig({ ...config, custom: [...config.custom, col] });
  };

  const saveColumnEdit = async ({ title, options }) => {
    const col = editColumn;
    if (!col) return;
    if (col.kind === 'builtin') {
      await persistConfig({
        ...config,
        optional_labels: { ...config.optional_labels, [col.key]: title },
        optional_options: options ? { ...config.optional_options, [col.key]: options } : config.optional_options,
      });
    } else {
      await persistConfig({
        ...config,
        custom: config.custom.map((c) =>
          c.id === col.id ? { ...c, title, config: options ? { ...c.config, options } : c.config } : c
        ),
      });
    }
    setEditColumn(null);
  };

  // Status capsule filter — drops non-matching task/milestone rows, keeps sections.
  const statusTasks = useMemo(() => {
    const all = tasks || [];
    if (status === 'all') return all;
    return all.filter((t) => t.type === 'section' || (t.status || 'Not Started') === status);
  }, [tasks, status]);

  const viewResult = useMemo(
    () => buildTaskView(statusTasks, columns, { filters, sort, groupBy }),
    [statusTasks, columns, filters, sort, groupBy]
  );

  const runExport = (format) => {
    const rows = flattenTaskRows(viewResult, tasks || []);
    const name = block.title || 'Initiative';
    const title = `${name} — Tasks & Milestones`;
    if (format === 'chart-pdf') exportDashboardToPdf(exportRefs.current.dashboard, `${name} — Analytics`);
    else if (format === 'chart-ppt') exportChartsToPpt([
      { title: 'Execution Velocity', node: exportRefs.current.velocity },
      { title: 'Activity Plan vs Completion', node: exportRefs.current.quarterly },
    ], `${name} — Analytics`);
    else if (format === 'excel') exportTasksToExcel(rows, columns, title);
    else exportTasksToPdf(rows, columns, title, viewResult.active ? 'Current View' : 'All Tasks');
  };

  const openTask = draft || (openTaskId ? (tasks || []).find((t) => t.id === openTaskId) || null : null);
  // Single selection covers both top-level tasks/milestones and section headers.
  const selectedTask = selectedId
    ? (tasks || []).find((t) => t.id === selectedId) || null
    : null;
  const sectionSelected = selectedTask?.type === 'section';
  const toggleCollapse = (id) => setCollapsedIds((cur) => {
    const next = new Set(cur);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const statusOptions = (builtinColumn(config, 'status')?.options || []).map((o) => ({
    value: o.name,
    dot: OPTION_COLORS.find((c) => c.id === o.color)?.dot || 'bg-muted-foreground/40',
  }));

  // Same semantics as the detail pane: Completed fills completion + 100% progress.
  const changeSelectedStatus = async (value) => {
    const id = selectedTask.id;
    clearSelection();
    await saveTask(id, { status: value, completed: value === 'Completed', ...(value === 'Completed' ? { progress: 100 } : {}) });
  };

  return (
    <div className="space-y-3">
      {tasks !== null && topLevelTasks.length > 0 && (
        <TaskSummaryTiles tasks={topLevelTasks} />
      )}

      <div className={cn('flex items-center justify-between gap-2 flex-wrap', readOnly && 'hidden')}>
        <div className={cn(viewMode === 'charts' && 'opacity-40 pointer-events-none cursor-not-allowed')}>
          <TaskStatusTabs tasks={topLevelTasks} value={status} onChange={setStatus} />
        </div>
        {!onControls && (
          <TaskHeaderActions onAdd={newDraft} onManageColumns={() => setManageOpen(true)} disabled={tasks === null} />
        )}
        <div className="flex items-center gap-2 ml-auto">
        <TaskViewToggle value={viewMode} onChange={setViewMode} />
        <TaskToolbar
          chartsMode={viewMode === 'charts'}
          tasks={tasks || []}
          columns={columns}
          filters={filters}
          onFilter={(id, value) => setFilters((f) => { const next = { ...f }; if (value) next[id] = value; else delete next[id]; return next; })}
          onClearFilters={() => setFilters({})}
          groupBy={groupBy}
          onGroup={setGroupBy}
          onClearGroup={() => setGroupBy('')}
          sort={sort}
          onSort={setSort}
          onExport={runExport}
        />
        </div>
      </div>

      {tasks === null ? (
        <TableLoading />
      ) : viewMode === 'charts' ? (
        <TaskChartsView tasks={topLevelTasks} exportRefs={exportRefs} />
      ) : (
        <TaskTable
          tasks={statusTasks}
          columns={columns}
          viewResult={viewResult}
          readOnly={readOnly}
          onOpen={(t) => { clearSelection(); setOpenTaskId(t.id); }}
          onReorder={reorderTasks}
          onReorderSections={reorderSections}
          selectedId={readOnly ? null : selectedTask?.id}
          onToggleSelect={readOnly ? undefined : (id) => setSelectedId((cur) => (cur === id ? null : id))}
          moving={moving}
          collapsedIds={collapsedIds}
          onToggleCollapse={toggleCollapse}
        />
      )}

      {!readOnly && (
        <TaskActionBar
          open={!!selectedTask && !deleteTarget && !openTask}
          className="sticky bottom-0 z-30"
          showStatus={!sectionSelected}
          moving={moving}
          moveDisabled={viewResult.active}
          currentStatus={selectedTask?.status || 'Not Started'}
          statuses={statusOptions}
          onView={() => { const id = selectedTask.id; clearSelection(); setOpenTaskId(id); }}
          onMove={() => setMoving((m) => !m)}
          onChangeStatus={changeSelectedStatus}
          onDelete={() => setDeleteTarget(selectedTask)}
          onClose={clearSelection}
        />
      )}

      <ManageTaskColumnsPane
        isOpen={manageOpen}
        onClose={() => setManageOpen(false)}
        config={config}
        onChange={persistConfig}
        onEdit={setEditColumn}
        onAddColumn={() => setAddColOpen(true)}
      />
      <AddColumnModal isOpen={addColOpen} onClose={() => setAddColOpen(false)} onCreate={createColumn} overlayClassName="z-[130]" />
      <EditTaskColumnModal
        isOpen={editColumn !== null}
        column={editColumn}
        onClose={() => setEditColumn(null)}
        onSave={saveColumnEdit}
      />
      <TaskDetailPane
        task={openTask}
        columns={columns}
        existingIds={(tasks || []).filter((t) => t.id !== openTask?.id).map((t) => t.custom_id).filter(Boolean)}
        onClose={() => { setOpenTaskId(null); setDraft(null); }}
        onSave={saveTask}
        onCreate={createTask}
        onDelete={setDeleteTarget}
        onSubtasksAllComplete={syncFromSubtasks}
      />
      <DeleteTaskDialog
        isOpen={!!deleteTarget}
        task={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}