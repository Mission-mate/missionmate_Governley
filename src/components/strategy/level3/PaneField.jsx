import React from 'react';

/** Small labelled read-only field used inside the detail pane muted panel. */
export default function PaneField({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm text-foreground">{children || '—'}</div>
    </div>
  );
}