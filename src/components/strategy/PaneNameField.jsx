import React from 'react';
import { Label } from '@/components/ui/label';
import AutoGrowTextarea from './level5/tasks/detail/AutoGrowTextarea';

/** Name field shared by the strategy level detail panes — grows so long names are fully readable. */
export default function PaneNameField({ value, onChange, editing }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Name</Label>
      {editing ? (
        <AutoGrowTextarea
          value={value || ''}
          onChange={onChange}
          className="rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
        />
      ) : (
        <p className="text-sm text-foreground">{value}</p>
      )}
    </div>
  );
}