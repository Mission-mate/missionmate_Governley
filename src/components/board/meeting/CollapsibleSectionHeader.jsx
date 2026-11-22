import React from 'react';

/**
 * Shared header for the meeting profile sections.
 * Row 1: section icon + title (and an optional count badge), with the action on the right.
 * Row 2: the sub-heading.
 */
export default function CollapsibleSectionHeader({ icon, title, count, subtitle, action }) {
  return (
    <div className="mb-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 flex items-center justify-center shrink-0">{icon}</span>
            <h2 className="text-lg font-bold text-foreground">{title}</h2>
            {count != null && (
              <span className="min-w-[22px] h-[22px] px-1.5 rounded-full inline-flex items-center justify-center bg-muted text-xs font-medium tabular-nums text-muted-foreground">
                {count}
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        {action}
      </div>
    </div>
  );
}