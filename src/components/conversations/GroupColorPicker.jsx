import React from 'react';
import { Check } from 'lucide-react';
import { GROUP_COLORS } from '@/lib/groupColors';
import { cn } from '@/lib/utils';

/** Swatches from the folder / note palette. The selected one is ringed and ticked. */
export default function GroupColorPicker({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-3" role="radiogroup" aria-label="Group colour">
      {GROUP_COLORS.map((c) => {
        const active = value === c.key;
        return (
          <button
            key={c.key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={c.key}
            title={c.key}
            disabled={disabled}
            onClick={() => onChange(c.key)}
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 disabled:opacity-50',
              active ? 'ring-2 ring-offset-2 ring-offset-card ring-foreground scale-110' : 'hover:scale-105',
            )}
            style={{ background: c.back }}
          >
            {active && <Check className="w-4 h-4 text-white drop-shadow" strokeWidth={2.6} />}
          </button>
        );
      })}
    </div>
  );
}