import React from 'react';
import { Calendar } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { isOverdue, STATUS_STYLES } from '@/lib/complianceApi';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { PriorityBars } from '@/components/programs/planner/grid/PlannerListCell';
import RowSelector from '@/components/programs/planner/grid/RowSelector';
import { overdueLabel } from '@/lib/overdueLabel';

/** Board card for a compliance obligation — mirrors the Planner board card styling. */
export default function ObligationBoardCard({ obligation, selected, onOpen, onToggleSelect }) {
  const status = obligation.status || 'Not Started';
  const s = STATUS_STYLES[status] || STATUS_STYLES['Not Started'];
  const done = status === 'Completed';
  const late = isOverdue(obligation.due_date, status);
  const due = obligation.due_date ? parseISO(obligation.due_date) : null;
  const hasDue = due && isValid(due);

  return (
    <div role="button" tabIndex={0} onClick={onOpen}
      onKeyDown={(e) => { if (e.key === 'Enter') onOpen(); }}
      className={cn('w-full text-left border rounded-xl p-3 mb-2 shadow-sm transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        selected ? 'bg-primary/10 border-primary/40' : late ? 'bg-red-50 border-red-200 dark:bg-red-500/10 dark:border-red-500/30' : 'bg-card border-border')}>
      <div className="flex items-center gap-2 mb-2">
        <RowSelector selected={selected} onToggle={onToggleSelect} />
        <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5', s.bg, s.text)}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" />{status}
        </span>
      </div>
      <p title={obligation.title} className={cn('text-[13px] font-semibold leading-snug truncate', done ? 'text-muted-foreground line-through' : 'text-foreground')}>{obligation.title}</p>
      {(obligation.category || obligation.regulator) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs text-foreground">
          {obligation.category && <span>Category: {obligation.category}</span>}
          {obligation.category && obligation.regulator && <span>·</span>}
          {obligation.regulator && <span>Regulator: {obligation.regulator}</span>}
        </div>
      )}
      <div className={cn('flex items-center gap-2 mt-3 pt-2.5 border-t', late ? 'border-red-200 dark:border-red-500/30' : 'border-border')}>
        {obligation.owner
          ? <PersonInitialsAvatar name={obligation.owner} className="h-6 w-6 text-[10px] ring-2 ring-card" />
          : <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />}
        <span className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
          <span className={cn('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold whitespace-nowrap',
            late ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300' : hasDue ? 'bg-muted text-foreground' : 'text-muted-foreground')}>
            <Calendar className={cn('w-3 h-3', late ? 'text-current' : 'text-muted-foreground')} />{hasDue ? format(due, 'd MMM') : 'No date'}
          </span>
          {late && <span className="text-[11px] font-medium text-red-600 dark:text-red-400 truncate">{overdueLabel(obligation.due_date)}</span>}
        </span>
        <span className="shrink-0" title={obligation.priority || undefined}>
          {obligation.priority ? <PriorityBars value={obligation.priority} /> : <span className="text-muted-foreground text-xs">—</span>}
        </span>
      </div>
    </div>
  );
}