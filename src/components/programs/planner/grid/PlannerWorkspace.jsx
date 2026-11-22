import React, { useState, useMemo } from 'react';
import PlannerToolbar from './PlannerToolbar';
import { toViewColumns, viewFields, toRecords, applyPlannerView } from '@/lib/programs/plannerView';
import { List, LayoutGrid, Columns3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PlannerManageColumnsPane from './PlannerManageColumnsPane';
import PlannerAddMenu from './PlannerAddMenu';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import usePlannerGrid from '@/hooks/usePlannerGrid';
import PlannerBoard from './PlannerBoard';
import PlannerList from './PlannerList';
import TaskViewToggle from '@/components/strategy/level5/tasks/TaskViewToggle';
import TaskPane from './TaskPane';
import SectionPane from './SectionPane';
import ColumnPane from './ColumnPane';
import PlannerSelectionBar from './PlannerSelectionBar';
import { reorderRows, findStatusColumn, moveSection, deleteSection } from '@/lib/programs/plannerApi';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';

const VIEWS = [{ id: 'board', label: 'Board', Icon: LayoutGrid }, { id: 'list', label: 'List', Icon: List }];

/** Planner grid workspace: Board (default) and List views, all editing via side panes. */
export default function PlannerWorkspace({ plannerId, header = null }) {
  const grid = usePlannerGrid(plannerId);
  const [view, setView] = useState('board');
  const [pane, setPane] = useState(null); // { kind, record, edit, sectionId }
  const [manageOpen, setManageOpen] = useState(false);
  const close = () => setPane(null);

  const handlers = {
    onOpenTask: (record) => setPane({ kind: 'task', record }),
    onAddTask: (sectionId) => setPane({ kind: 'task', record: null, sectionId }),
    onOpenSection: (record) => setPane({ kind: 'section', record }),
    onAddSection: () => setPane({ kind: 'section', record: null }),
    onAddColumn: () => setPane({ kind: 'column', record: null }),
  };
  const is = (k) => pane?.kind === k;
  const [deleting, setDeleting] = useState(null);
  const sectionActions = {
    onView: (s) => setPane({ kind: 'section', record: s }),
    onEdit: (s) => setPane({ kind: 'section', record: s, edit: true }),
    onMove: async (s, dir) => { await moveSection(grid.sections, s.id, dir); await grid.refresh(); },
    onDelete: (s) => setDeleting(s),
  };

  const [selectedId, setSelectedId] = useState(null);
  const [moving, setMoving] = useState(false);
  const clearSelection = () => { setSelectedId(null); setMoving(false); };
  const selectedRow = grid.rows.find((r) => r.id === selectedId) || null;
  const selection = {
    selectedId, moving,
    onToggleSelect: (id) => { setMoving(false); setSelectedId((cur) => (cur === id ? null : id)); },
    onReorder: async (ordered, sectionId) => { await reorderRows(ordered, sectionId); await grid.refresh(); },
  };
  const switchView = (id) => { clearSelection(); setView(id); };

  // Shared search / filter / group / sort, applied identically to List and Board.
  const [dataView, setDataView] = useState({ search: '', filters: {}, sort: null, groupBy: '' });
  const viewColumns = useMemo(() => toViewColumns(grid.columns), [grid.columns]);
  const fields = useMemo(() => viewFields(viewColumns), [viewColumns]);
  const records = useMemo(() => toRecords(grid), [grid.rows, grid.columns, grid.cellMap]);
  const derived = useMemo(() => applyPlannerView(grid, records, dataView), [grid.sections, records, dataView]);
  const shownGrid = { ...grid, sections: derived.sections, rowsBySection: derived.rowsBySection, grouped: derived.grouped };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        {header}
        <div className="flex items-center gap-2 ml-auto">
        <PlannerAddMenu canAddTask={!!grid.sections.length} onAddTask={() => handlers.onAddTask(grid.sections[0]?.id)}
          onAddColumn={handlers.onAddColumn} onAddSection={handlers.onAddSection} />
        <Button className="gap-1.5" onClick={() => setManageOpen(true)}><Columns3 className="w-4 h-4" /> Manage Columns</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <TaskViewToggle value={view} onChange={switchView} options={VIEWS} />
        <PlannerToolbar view={dataView} setView={(u) => { setMoving(false); setDataView(u); }} records={records} fields={fields} viewColumns={viewColumns}
          statusColumn={findStatusColumn(grid.columns)} selectedId={selectedId} />
      </div>

      {grid.isLoading ? <ModuleLoader /> : grid.failure.isLoadingError ? <LoadError failure={grid.failure} title="Couldn’t load this planner" /> : view === 'board' ? <PlannerBoard grid={shownGrid} selection={selection} sectionActions={sectionActions} {...handlers} /> : <PlannerList grid={shownGrid} selection={selection} sectionActions={sectionActions} {...handlers} />}
      <ConfirmDeleteDialog isOpen={!!deleting} title="Delete Section" requireKeyword="DELETE"
        message={`This permanently deletes "${deleting?.title}" and its ${(grid.rowsBySection[deleting?.id] || []).length} task(s). This action cannot be undone.`}
        onClose={() => setDeleting(null)} onConfirm={async () => { await deleteSection(deleting); setDeleting(null); clearSelection(); await grid.refresh(); }} />

      <PlannerSelectionBar row={selectedRow} grid={grid} plannerId={plannerId} moving={moving} moveDisabled={derived.active} onToggleMove={() => setMoving((m) => !m)}
        onView={() => { setMoving(false); setPane({ kind: 'task', record: selectedRow }); }}
        onEdit={() => { setMoving(false); setPane({ kind: 'task', record: selectedRow, edit: true }); }}
        onCleared={clearSelection} />

      <TaskPane isOpen={is('task')} row={is('task') ? pane.record : null} startEditing={is('task') && pane.edit} sectionId={pane?.sectionId} plannerId={plannerId} grid={grid} onClose={close} />
      <SectionPane isOpen={is('section')} section={is('section') ? pane.record : null} startEditing={is('section') && pane.edit} plannerId={plannerId} sections={grid.sections}
        taskCount={is('section') && pane.record ? (grid.rowsBySection[pane.record.id] || []).length : 0} onClose={close} onSaved={grid.refresh} />
      <PlannerManageColumnsPane isOpen={manageOpen} onClose={() => setManageOpen(false)} columns={grid.columns}
        onEdit={(c) => setPane({ kind: 'column', record: c, edit: true })} onDeleted={grid.refresh} />
      <ColumnPane isOpen={is('column')} column={is('column') ? pane.record : null} startEditing={is('column') && pane.edit} plannerId={plannerId} columns={grid.columns} onClose={close} onSaved={grid.refresh} />
    </div>
  );
}