import React from 'react';

/** Muted full-width band row used when the task table is grouped by a column. */
export default function TaskGroupHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 bg-muted border-b border-border">
      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">{label}</span>
      <span className="text-[11px] font-medium text-muted-foreground bg-background rounded-full px-2 py-0.5">
        {count}
      </span>
    </div>
  );
}