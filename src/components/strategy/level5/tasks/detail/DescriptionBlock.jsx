import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import AutoGrowTextarea from './AutoGrowTextarea';

/** Optional description: hidden behind "Add Description" until opened; omitted in view mode when empty. */
export default function DescriptionBlock({ value, onChange, readOnly }) {
  const [open, setOpen] = useState(false);
  const hasValue = !!(value || '').trim();

  if (readOnly) {
    if (!hasValue) return null;
    return (
      <div className="mt-4">
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Description</p>
        <p className="text-sm text-foreground whitespace-pre-wrap break-words">{value}</p>
      </div>
    );
  }

  if (!open && !hasValue) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors">
        <Plus className="w-4 h-4" /> Add Description
      </button>
    );
  }

  return (
    <div className="mt-4">
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">Description</p>
      <AutoGrowTextarea
        value={value}
        onChange={onChange}
        autoFocus={open && !hasValue}
        placeholder="Add a description…"
        className="min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm break-words focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
      />
    </div>
  );
}