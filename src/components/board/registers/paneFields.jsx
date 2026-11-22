import React from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

/** Field label for register side panes, with the mandatory asterisk and error tone. */
export function FieldLabel({ children, required, error }) {
  return (
    <Label className={cn('mb-1.5 block text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}{required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

/** Plain value display for a pane's view mode (no field container). */
export function ViewValue({ value, multiline }) {
  const empty = value === undefined || value === null || String(value).trim() === '';
  if (empty) return <p className="text-sm text-muted-foreground/50">—</p>;
  return <p className={cn('text-sm text-foreground', multiline && 'whitespace-pre-wrap')}>{value}</p>;
}