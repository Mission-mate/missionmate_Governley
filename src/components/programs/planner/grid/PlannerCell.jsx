import React from 'react';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';
import StrategyCustomCell, { optionBadgeClass } from '@/components/strategy/customFields/StrategyCustomCell';

/** Read-only display of one planner cell value (reuses the shared custom column cell). */
export default function PlannerCell({ column, value }) {
  if (column.type === 'Date' && value) {
    const d = parseISO(value);
    return <span className="text-sm text-foreground">{isValid(d) ? format(d, 'd MMM yyyy') : value}</span>;
  }
  if (column.type === 'Multi Select' && Array.isArray(value) && value.length) {
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((v) => (
          <span key={v} className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', optionBadgeClass(column, v))}>{v}</span>
        ))}
      </span>
    );
  }
  return <StrategyCustomCell column={column} value={value} />;
}