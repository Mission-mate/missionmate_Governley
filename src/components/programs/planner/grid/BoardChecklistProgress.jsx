import React from 'react';

/** Checklist progress row on a Board card — hidden when the task has no checklist items. */
export default function BoardChecklistProgress({ counts }) {
  if (!counts?.total) return null;
  const pct = Math.round((counts.done / counts.total) * 100);
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">{counts.done} of {counts.total} completed</span>
    </div>
  );
}