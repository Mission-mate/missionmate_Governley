import React from 'react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

/**
 * Shared Custom Column → Column Type picker. Soft rounded control with a
 * pale-blue rounded hover/selected treatment on options (light + dark).
 * types: array of type strings or { type } objects.
 */
export default function ColumnTypeSelect({ value, onChange, types, disabled }) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-9 rounded-lg border-border bg-card text-foreground shadow-none disabled:opacity-60">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="z-[200] rounded-xl border-border/70 p-1 shadow-lg">
        {types.map((t) => {
          const val = typeof t === 'string' ? t : t.type;
          return (
            <SelectItem key={val} value={val} className="rounded-lg px-2.5 py-2 data-[state=checked]:bg-primary/10">
              {val}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}