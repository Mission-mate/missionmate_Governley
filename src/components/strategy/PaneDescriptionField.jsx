import React from 'react';
import { Label } from '@/components/ui/label';
import AutoGrowTextarea from './level5/tasks/detail/AutoGrowTextarea';

/**
 * Description field shared by every strategy level detail pane.
 * View mode shows the text; edit mode shows a white, auto-growing textarea
 * (no manual resize handle, no inner scrolling).
 */
export default function PaneDescriptionField({ value, onChange, editing }) {
  if (!editing && !value) return null;

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Description</Label>
      {editing ? (
        <AutoGrowTextarea
          value={value || ''}
          onChange={onChange}
          placeholder="Brief description..."
          className="min-h-[56px] rounded-md border border-input bg-card px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
        />
      ) : (
        <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}