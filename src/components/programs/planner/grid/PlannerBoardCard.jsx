import React from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { readCell, cellKey, COMPLETED } from '@/lib/programs/plannerApi';
import { optionBadgeClass } from '@/components/strategy/customFields/StrategyCustomCell';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { PriorityBars } from './PlannerListCell';
import RowSelector from './RowSelector';
import BoardChecklistProgress from './BoardChecklistProgress';
import { overdueDays, daysAgoLabel } from '@/lib/programs/plannerOverdue';

const bySystem = (columns, key) => columns.find((c) => c.system_key === key);

/** Board card: status pill, title, divider, then owner avatar · due date · priority bars. */
export default function PlannerBoardCard({ row, columns, cellMap, checklist, selected, moving, onOpen, onToggleSelect }) {
  const read = (key) => { const c = bySystem(columns, key); return c ? readCell(cellMap[cellKey(row.id, c.id)], c) : ''; };
  const statusCol = bySystem(columns, 'status');
  const status = read('status');
  const owners = [].concat(read('owner') || []).filter(Boolean);
  const due = read('due_date') ? parseISO(read('due_date')) : null;
  const priority = read('priority');
  const done = status === COMPLETED;
  const late = overdueDays(read('due_date'), done);

  return (
    <div role="button" tabIndex={0} onClick={moving ? undefined : onOpen}
      className={cn('w-full text-left border rounded-xl p-3 mb-2 shadow-sm transition-all duration-200',
        selected ? 'bg-primary/10 border-primary/40' : late ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30' : 'bg-card border-border',
        moving ? 'cursor-default' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md')}>
      <div className="flex items-center gap-2 mb-2">
        <RowSelector selected={selected} moving={moving} onToggle={onToggleSelect} />
        {status ? (
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5', optionBadgeClass(statusCol, status))}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" />{status}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />No status</span>
        )}
      </div>
      <p title={row.title} className={cn('text-[13px] font-medium leading-snug line-clamp-2 break-words', done ? 'text-muted-foreground line-through' : 'text-foreground')}>{row.title}</p>
      <div className={cn('flex items-center gap-2 mt-3 pt-2.5 border-t', late ? 'border-red-200 dark:border-red-500/30' : 'border-border')}>
        <div className="flex -space-x-1.5 shrink-0">
          {owners.length ? owners.slice(0, 3).map((n) => <PersonInitialsAvatar key={n} name={n} className="h-6 w-6 text-[10px] ring-2 ring-card" />)
            : <span className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/40" />}
        </div>
        <span className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap',
            late ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : due && isValid(due) ? 'bg-muted text-foreground' : 'text-muted-foreground')}>
            <Calendar className={cn('w-3 h-3', late ? 'text-current' : 'text-muted-foreground')} />{due && isValid(due) ? format(due, 'd MMM') : 'No date'}
          </span>
          {late > 0 && <span className="text-[11px] font-medium text-red-600 dark:text-red-400 truncate">{daysAgoLabel(late)}</span>}
        </span>
        <span className="shrink-0">{priority ? <PriorityBars value={priority} /> : <span className="text-muted-foreground text-xs">—</span>}</span>
      </div>
      <BoardChecklistProgress counts={checklist} />
    </div>
  );
}