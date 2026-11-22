import React from 'react';
import { DECISION_TYPES } from '@/lib/decisions';
import { cn } from '@/lib/utils';

/** Two radio cards for choosing between a Decision and a Resolution. */
export default function DecisionTypeChoice({ value, onChange }) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-3">
      {DECISION_TYPES.map((type) => {
        const selected = value === type.value;
        return (
          <button
            key={type.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(type.value)}
            className={cn(
              'flex items-start gap-3 rounded-xl border px-4 py-3 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              selected ? 'border-primary bg-primary/5' : 'border-border bg-card hover:bg-muted/50'
            )}
          >
            <span className={cn(
              'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
              selected ? 'border-primary' : 'border-muted-foreground/50'
            )}>
              {selected && <span className="h-2 w-2 rounded-full bg-primary" />}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{type.value}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{type.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}