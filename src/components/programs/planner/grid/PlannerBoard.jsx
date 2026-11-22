import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import PlannerBoardCard from './PlannerBoardCard';
import SectionRows from './SectionRows';
import usePlannerChecklistCounts from './usePlannerChecklistCounts';
import SectionActionsMenu from './SectionActionsMenu';
import BoardCompletedGroup from './BoardCompletedGroup';
import PlannerDragContext from './PlannerDragContext';
import { findStatusColumn, readCell, cellKey, COMPLETED } from '@/lib/programs/plannerApi';
import { AddSectionIcon } from '@/components/strategy/level5/tasks/AddItemIcons';

/** Board view: one bucket per Planner Section, task cards inside. */
export default function PlannerBoard({ grid, selection, onOpenTask, onAddTask, onOpenSection, onAddSection, sectionActions }) {
  const { sections, columns, cellMap, rowsBySection, grouped } = grid;
  const { selectedId, moving, onToggleSelect, onReorder } = selection;
  const checklists = usePlannerChecklistCounts(sections.flatMap((s) => (rowsBySection[s.id] || []).map((r) => r.id)));
  const statusColumn = findStatusColumn(columns);
  const isDone = (r) => !!statusColumn && readCell(cellMap[cellKey(r.id, statusColumn.id)], statusColumn) === COMPLETED;
  const renderCard = (r) => (
    <PlannerBoardCard row={r} columns={columns} cellMap={cellMap} checklist={checklists[r.id]} selected={selectedId === r.id} moving={moving}
      onOpen={() => onOpenTask(r)} onToggleSelect={() => onToggleSelect(r.id)} />
  );

  const openRows = (id) => (rowsBySection[id] || []).filter((r) => !isDone(r));

  return (
    <PlannerDragContext rowsFor={openRows} onReorder={onReorder}>
    <div className="content-enter flex gap-4 overflow-x-auto pb-4 items-start">
      {sections.map((s, i) => {
        const all = rowsBySection[s.id] || [];
        const rows = openRows(s.id);
        const doneRows = all.filter(isDone);
        return (
          <div key={s.id} className="w-72 shrink-0 rounded-xl bg-muted p-3">
            <div className="flex items-start gap-2 mb-3">
              <button onClick={grouped ? undefined : () => onOpenSection(s)} className={cn('flex items-center gap-2 px-1 py-1 min-w-0 text-left', grouped ? 'cursor-default' : 'hover:opacity-80')}>
                <span className="text-sm font-bold text-foreground truncate">{s.title}</span>
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-card shadow-sm ring-1 ring-border text-xs text-muted-foreground flex items-center justify-center shrink-0">{rows.length}</span>
              </button>
              {!grouped && <div className="ml-auto"><SectionActionsMenu section={s} horizontal actions={{ ...sectionActions, index: i, count: sections.length }} /></div>}
            </div>
            <SectionRows sectionId={s.id} rows={rows} selectedId={selectedId} moving={moving} renderRow={renderCard} />
            {!moving && !grouped && (
              <button onClick={() => onAddTask(s.id)} className="flex items-center gap-1.5 px-1 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add task
              </button>
            )}
            <BoardCompletedGroup rows={doneRows} renderCard={(r) => renderCard(r)} />
          </div>
        );
      })}
      {!sections.length && <div className="py-10 px-4 text-sm text-muted-foreground">No tasks match the current view.</div>}
      {!grouped && <div className="w-72 shrink-0 rounded-xl bg-muted p-3">
        <button onClick={onAddSection} className="flex items-center gap-2.5 px-3 h-12 w-full rounded-xl bg-card border border-border shadow-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-md transition-all">
          <span className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/15 flex items-center justify-center"><AddSectionIcon className="w-4 h-4" /></span>
          <Plus className="w-4 h-4" /> Add Section
        </button>
      </div>}
    </div>
    </PlannerDragContext>
  );
}