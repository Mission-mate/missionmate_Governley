import React from 'react';
import { statusOf, statusTone } from '@/lib/obligationTasks';

/** Compact single green bar with an "X of Y Completed" label. */
export default function TaskProgressBar({ tasks }) {
  const total = tasks.length;
  const done = tasks.filter((t) => statusOf(t) === 'Completed').length;
  const pct = total ? (done / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2.5 max-w-full">
      <div className="w-40 h-1.5 shrink-0 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full ${statusTone('Completed').dot} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground tabular-nums whitespace-nowrap">{done} of {total} Completed</span>
    </div>
  );
}