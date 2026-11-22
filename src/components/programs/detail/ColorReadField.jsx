import React from 'react';
import { cn } from '@/lib/utils';
import { PROGRAM_COLORS } from '@/components/programs/CreateProgramModal';

/** Read-only colour value: swatch dot + label. Falls back to Blue. */
export default function ColorReadField({ label, value }) {
  const c = PROGRAM_COLORS.find((o) => o.key === value) || PROGRAM_COLORS[0];
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
      <span className="flex items-center gap-2 text-sm text-foreground">
        <span className={cn('w-3.5 h-3.5 rounded-full', c.dot)} />{c.label}
      </span>
    </div>
  );
}