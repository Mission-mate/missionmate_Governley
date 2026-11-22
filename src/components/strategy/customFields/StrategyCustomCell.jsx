import React from 'react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/registerColors';
import OwnerAvatarList from '@/components/strategy/OwnerAvatarList';

/** Badge classes for a Single Select value using the shared option palette. */
export function optionBadgeClass(column, value) {
  const opt = (column.config?.options || []).find((o) => o.name === value);
  const tint = OPTION_COLORS.find((c) => c.id === opt?.color) || OPTION_COLORS[0];
  return cn(tint.bg, tint.text);
}

const Dash = () => <span className="text-sm text-muted-foreground">—</span>;

/** Read-only table cell for one custom strategy column. */
export default function StrategyCustomCell({ column, value }) {
  if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
    return <Dash />;
  }

  if (column.type === 'Single Select') {
    return (
      <span className={cn('inline-flex w-fit items-center text-xs font-medium rounded-full px-2.5 py-0.5', optionBadgeClass(column, value))}>
        {value}
      </span>
    );
  }

  if (column.type === 'Date') {
    let label = value;
    try { label = format(parseISO(value), 'MMM d, yyyy'); } catch { /* keep raw */ }
    return <span className="text-sm text-foreground">{label}</span>;
  }

  if (column.type === 'People') {
    return <OwnerAvatarList owners={Array.isArray(value) ? value : [value]} />;
  }

  if (column.type === 'Progress') {
    const pct = Math.max(0, Math.min(100, Number(value) || 0));
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="h-1.5 flex-1 min-w-[40px] rounded-full bg-muted overflow-hidden">
          <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </span>
        <span className="text-xs text-muted-foreground shrink-0">{pct}%</span>
      </span>
    );
  }

  return <span className="text-sm text-foreground truncate">{String(value)}</span>;
}