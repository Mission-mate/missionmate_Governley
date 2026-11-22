import React from 'react';
import { cn } from '@/lib/utils';
import { LEVEL2_COLORS } from '@/lib/strategyLevel2';

/** Coloured uppercase Level 2 label badge. */
export default function Level2Badge({ pillar }) {
  if (!pillar) return null;
  return (
    <span className={cn(
      'inline-flex w-fit items-center text-[11px] font-semibold uppercase tracking-wide rounded px-2 py-0.5',
      LEVEL2_COLORS[pillar.color]?.badge || LEVEL2_COLORS.amber.badge
    )}>
      {pillar.name}
    </span>
  );
}