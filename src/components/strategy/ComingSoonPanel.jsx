import React from 'react';
import { Hourglass } from 'lucide-react';

/** Placeholder dropdown shown under Level 3 / 4 / 7 rows. */
export default function ComingSoonPanel() {
  return (
    <div className="flex flex-col items-center justify-center gap-1.5 py-8 bg-muted/30 border border-dashed border-border rounded-lg">
      <Hourglass className="w-5 h-5 text-muted-foreground" />
      <p className="text-sm font-semibold text-foreground">Coming Soon</p>
      <p className="text-xs text-muted-foreground">Expanded details for this level are on the way.</p>
    </div>
  );
}