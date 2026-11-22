import React from 'react';
import { cn } from '@/lib/utils';
import { OPTION_COLORS } from '@/lib/registerColors';

/**
 * Coloured option label. Default renders a pill; `dotted` renders a solid
 * dot + coloured text (used for Health) with no background.
 */
export default function OptionLabel({ name, color, dotted = false }) {
  const c = OPTION_COLORS.find((x) => x.id === color);
  if (dotted) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium min-w-0', c ? c.text : 'text-foreground')}>
        <span className={cn('w-2 h-2 rounded-full shrink-0', c ? c.dot : 'bg-muted-foreground/40')} />
        <span className="truncate">{name}</span>
      </span>
    );
  }
  return (
    <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', c ? `${c.bg} ${c.text}` : 'bg-muted text-foreground')}>
      {name}
    </span>
  );
}

/** Health renders as dot + text; every other select keeps its pill. */
export const isDottedColumn = (column) => column?.kind !== 'custom' && column?.key === 'health';