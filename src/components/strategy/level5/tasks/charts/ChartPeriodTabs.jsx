import React from 'react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
];

/** Compact Month / Quarter / Year switcher, styled like the segmented button tabs. */
export default function ChartPeriodTabs({ value, onChange }) {
  return (
    <div className="inline-flex items-center gap-1 p-0.5 rounded-lg bg-muted shrink-0">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            'px-2 py-0.5 rounded-md text-xs transition-colors',
            value === o.key
              ? 'bg-card text-foreground font-semibold shadow-sm'
              : 'text-muted-foreground font-medium hover:text-foreground'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}