import React from 'react';
import { Eye, SquarePen } from 'lucide-react';

/**
 * Shared guide line shown under drawer titles.
 * View mode: "View only. Click [icon] to {action}." Edit mode (`editing`): "[edit icon] Edit mode. Save or cancel to finish editing."
 * The line fades in on each mode switch so the hint changes in place.
 */
export default function ViewModeHint({ className = '', icon: Icon = SquarePen, action = 'edit', editing = false }) {
  return (
    <div key={editing ? 'edit' : 'view'} className={`flex items-center gap-1.5 w-fit text-xs font-medium text-muted-foreground animate-expand-enter ${className}`}>
      {editing ? (
        <>
          <SquarePen className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
          <span>Edit mode. Save or cancel to finish editing.</span>
        </>
      ) : (
        <>
          <Eye className="w-3.5 h-3.5 shrink-0" />
          <span className="inline-flex items-center gap-1 flex-wrap">
            View only. Click
            <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={1.8} />
            to {action}.
          </span>
        </>
      )}
    </div>
  );
}