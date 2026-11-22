import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

/** Shared Customise pane header lockup: sliders icon tile + title + subtitle. */
export default function CustomisePaneTitle({ title = 'Customise Fields', subtitle }) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <SlidersHorizontal className="w-5 h-5 text-primary" />
      </div>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}