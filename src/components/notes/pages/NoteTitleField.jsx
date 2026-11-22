import React from 'react';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';

/** Editable note title with a subtle hover/focus tint and an "Edit note title" tooltip. */
export default function NoteTitleField({ value, onChange, autoFocus }) {
  return (
    <label
      title="Edit note title"
      className="block -mx-2 px-2 py-1 rounded-lg cursor-text transition-colors hover:bg-muted/70 focus-within:bg-muted/70"
    >
      <AutoGrowTextarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
        placeholder="Untitled"
        autoFocus={autoFocus}
        className="border-0 rounded-none bg-transparent p-0 shadow-none focus-visible:ring-0 text-xl font-semibold text-foreground break-words placeholder:text-muted-foreground/40"
      />
    </label>
  );
}