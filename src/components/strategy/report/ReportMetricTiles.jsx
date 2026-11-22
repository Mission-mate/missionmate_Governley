import React from 'react';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { cn } from '@/lib/utils';

/** Key precomputed figures shown above the narrative. */
export default function ReportMetricTiles({ metrics, compact = false }) {
  const overall = metrics?.overall || {};
  const tiles = [
    { label: 'Total Items', value: overall.total ?? 0 },
    { label: 'Completion', value: `${overall.completion_rate ?? 0}%` },
    { label: 'At Risk', value: overall.at_risk ?? 0 },
    { label: 'Overdue', value: overall.overdue ?? 0 },
    { label: 'Due in 30 Days', value: overall.due_next_30_days ?? 0 },
    { label: 'Unowned', value: overall.missing_owner ?? 0 },
  ];
  return (
    <div className={cn('grid gap-2.5', compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-6')}>
      {tiles.map((tile) => (
        <div key={tile.label} className={cn(ELEVATED_CARD, 'px-3 py-2.5')}>
          <p className="text-xl font-bold text-foreground leading-none">{tile.value}</p>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mt-1.5">{tile.label}</p>
        </div>
      ))}
    </div>
  );
}