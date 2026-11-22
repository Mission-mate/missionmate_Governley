import React from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { statusClass, healthClass, priorityClass } from '@/lib/programs/deliverableOptions';

const PILL = 'inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5 whitespace-nowrap';

export const StatusPill = ({ value }) => value ? <span className={cn(PILL, statusClass(value))}>{value}</span> : <span className="text-muted-foreground">–</span>;
export const PriorityPill = ({ value }) => value ? <span className={cn(PILL, priorityClass(value))}>{value}</span> : <span className="text-muted-foreground">–</span>;
export const HealthText = ({ value }) => value ? <span className={cn('text-sm font-medium', healthClass(value))}>{value}</span> : <span className="text-muted-foreground">–</span>;

/** Header health indicator — same pulse icon treatment as the Strategy module. */
export const HealthHeader = ({ value }) => (
  <span className={cn('inline-flex items-center gap-1.5 font-bold text-base', value ? healthClass(value) : 'text-muted-foreground')}>
    <Activity className="w-4 h-4 shrink-0" strokeWidth={2.25} />
    {value || '—'}
  </span>
);

export function ProgressBar({ value = 0 }) {
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${value || 0}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">{value || 0}%</span>
    </div>
  );
}