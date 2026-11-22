import React from 'react';
import { Label } from '@/components/ui/label';

/** Labelled settings field — renders the edit control, or a read-only value in view mode. */
export default function ProfileField({ label, required, error, editing, value, children }) {
  if (!editing) {
    return (
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">{value || '–'}</p>
      </div>
    );
  }
  return (
    <div>
      <Label className="text-sm text-foreground mb-1.5 block">
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive mt-1.5">{error}</p>}
    </div>
  );
}