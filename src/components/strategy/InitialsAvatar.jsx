import React from 'react';
import { cn } from '@/lib/utils';

/** Renders a name with an initials circle before it. Shared across all strategy levels. */
export default function InitialsAvatar({ name, className }) {
  const trimmed = (name || '').trim();
  if (!trimmed) return <span className="text-sm text-muted-foreground">—</span>;

  const initials = trimmed.
  split(/\s+/).
  slice(0, 2).
  map((w) => w[0]).
  join('').
  toUpperCase();

  return (
    <span className={cn('inline-flex items-center gap-2 min-w-0', className)}>
      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
        {initials}
      </span>
      <span className="truncate text-[hsl(var(--sidebar-foreground))] text-xs">{trimmed}</span>
    </span>);

}