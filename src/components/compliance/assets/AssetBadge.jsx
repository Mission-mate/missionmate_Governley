import React from 'react';
import { OPTION_COLORS } from '@/lib/registerColors';
import { cn } from '@/lib/utils';

/** Coloured pill for an enum value (Status, Condition, Ownership). */
export default function AssetBadge({ value, options = [] }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  const opt = options.find((o) => o.name === value);
  const text = opt?.label || value;
  const c = OPTION_COLORS.find((x) => x.id === opt?.color);
  if (!c) return <span className="text-sm text-foreground">{text}</span>;
  return (
    <span className={cn('inline-flex items-center text-xs font-medium rounded px-2 py-0.5 w-fit', c.bg, c.text)}>
      {text}
    </span>
  );
}