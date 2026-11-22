import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';
import { readCell, cellKey, COMPLETED } from '@/lib/programs/plannerApi';
import { AddSectionIcon } from '@/components/strategy/level5/tasks/AddItemIcons';
import PlannerListCell from './PlannerListCell';
import RowSelector from './RowSelector';
import SectionRows from './SectionRows';
import SectionActionsMenu from './SectionActionsMenu';

export const COL = 'flex-1 basis-0 min-w-0 px-3 self-stretch flex items-center border-l border-border/60';
export const NAME = 'flex-[2.5] basis-0 min-w-0';

/** One Planner section as a raised, collapsible card with completion progress. */
export default function PlannerSectionCard({ section, rows, columns, cellMap, statusColumn, open, onToggle, selection, onOpenTask, onAddTask, onOpenSection, sectionActions }) {
  const reveal = useCollapse(open);
  const { selectedId, moving, onToggleSelect } = selection;
  const isDone = (r) => statusColumn && readCell(cellMap[cellKey(r.id, statusColumn.id)], statusColumn) === COMPLETED;
  const done = rows.filter(isDone).length;
  const pct = rows.length ? Math.round((done / rows.length) * 100) : 0;

  const renderRow = (r) => {
    const complete = isDone(r);
    const selected = selectedId === r.id;
    return (
      <div onClick={moving ? undefined : () => onOpenTask(r)}
        className={cn('flex items-center h-11 border-t border-border/60 transition-colors bg-card', moving ? 'cursor-default' : 'cursor-pointer', selected ? 'bg-primary/10' : !moving && 'hover:bg-muted/40')}>
        <div className={cn(NAME, 'pl-4 pr-4 flex items-center gap-3')}>
          <RowSelector selected={selected} moving={moving} onToggle={() => onToggleSelect(r.id)} />
          <span className={cn('text-sm truncate', complete ? 'text-muted-foreground line-through' : 'text-foreground')}>{r.title}</span>
        </div>
        {columns.map((c) => (
          <div key={c.id} className={cn(COL, 'min-w-0 overflow-hidden')}><PlannerListCell column={c} value={readCell(cellMap[cellKey(r.id, c.id)], c)} done={isDone(r)} /></div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-3 h-12">
        <button onClick={onToggle} aria-label={open ? 'Collapse section' : 'Expand section'} className="text-muted-foreground hover:text-foreground">
          <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', !open && '-rotate-90')} />
        </button>
        <span className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/15 flex items-center justify-center"><AddSectionIcon className="w-4 h-4" /></span>
        {onOpenSection
          ? <button onClick={() => onOpenSection(section)} className="text-sm font-semibold text-foreground hover:opacity-80 truncate">{section.title}</button>
          : <span className="text-sm font-semibold text-foreground truncate">{section.title}</span>}
        <span className="text-xs font-medium text-muted-foreground bg-muted rounded-md px-1.5 py-0.5">{rows.length}</span>
        <div className="ml-auto flex items-center gap-3">
        {statusColumn && (
          <div className="flex items-center gap-3 pr-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">{done} of {rows.length} done</span>
            <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-500" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )}
        {sectionActions && <SectionActionsMenu section={section} actions={sectionActions} />}
        </div>
      </div>
      {reveal.mounted && <SectionRows className={reveal.className} sectionId={section.id} rows={rows} selectedId={selectedId} moving={moving} renderRow={renderRow} />}
      {open && !moving && onAddTask && (
        <button onClick={() => onAddTask(section.id)} className="flex items-center gap-1.5 pl-11 h-10 w-full border-t border-border/60 text-sm text-muted-foreground hover:text-foreground">
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      )}
    </div>
  );
}