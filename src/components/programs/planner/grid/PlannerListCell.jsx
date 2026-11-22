import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { optionBadgeClass } from '@/components/strategy/customFields/StrategyCustomCell';
import { isPriorityColumn } from '@/lib/programs/plannerApi';
import PlannerCell from './PlannerCell';
import { overdueDays, daysAgoLabel } from '@/lib/programs/plannerOverdue';

const BAR_LEVEL = { high: 3, medium: 2, low: 1 };
const BAR_TONE = { high: 'bg-red-500', medium: 'bg-orange-500', low: 'bg-emerald-500' };
const BAR_HEIGHTS = ['h-1.5', 'h-2.5', 'h-3.5'];
const Dash = () => <span className="text-muted-foreground">—</span>;

/** Three ascending signal bars, filled by priority level. */
export function PriorityBars({ value }) {
  const key = String(value || '').toLowerCase();
  const level = BAR_LEVEL[key] || 0;
  return (
    <span className="inline-flex items-end gap-[2px] h-3.5" aria-hidden="true">
      {BAR_HEIGHTS.map((h, i) => <span key={h} className={cn('w-[3px] rounded-sm', h, i < level ? BAR_TONE[key] : 'bg-muted-foreground/25')} />)}
    </span>
  );
}

/** List-view cell: dashes for empty, "3 Oct 2026" dates, dotted status pills, signal-bar priorities. */
export default function PlannerListCell({ column, value, done }) {
  if (value === '' || value == null || (Array.isArray(value) && !value.length)) return <Dash />;
  if (column.type === 'Date') {
    const d = parseISO(value);
    const late = column.system_key === 'due_date' ? overdueDays(value, done) : 0;
    return (
      <span className="flex flex-col leading-tight">
        <span className={cn('text-sm', late ? 'text-red-600 dark:text-red-400 font-medium' : 'text-foreground')}>{isValid(d) ? format(d, 'd MMM yyyy') : value}</span>
        {late > 0 && <span className="text-[11px] text-red-600/80 dark:text-red-400/80">{daysAgoLabel(late)}</span>}
      </span>
    );
  }
  if (isPriorityColumn(column)) {
    return (
      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
        <PriorityBars value={value} />
        {value}
      </span>
    );
  }
  if (column.type === 'Single Select') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2.5 py-0.5', optionBadgeClass(column, value))}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />{value}
      </span>
    );
  }
  return <PlannerCell column={column} value={value} />;
}