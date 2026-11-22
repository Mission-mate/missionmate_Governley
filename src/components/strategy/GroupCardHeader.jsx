import React from 'react';

/** Floating group label + count pill sitting above a grouped table card. */
export default function GroupCardHeader({ label, count }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-sm font-semibold text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
    </div>
  );
}