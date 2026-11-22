import React from 'react';
import { cn } from '@/lib/utils';

const OPTIONS = [
  { value: 'skip', label: 'Skip duplicates', hint: 'Leave the existing member untouched.' },
  { value: 'update', label: 'Update existing members', hint: 'Overwrite matching members with the CSV values.' },
];

/**
 * How to handle CSV rows whose email already matches an existing member.
 * Shown on the mapping step only when an Email column is mapped.
 */
export default function DuplicateModeChoice({ value, onChange }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
        If the email already exists
      </p>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              'text-left rounded-lg border px-3 py-2.5 transition-colors',
              value === opt.value
                ? 'border-primary bg-primary/5'
                : 'border-border hover:bg-muted/40'
            )}
          >
            <span className="block text-sm font-medium text-foreground">{opt.label}</span>
            <span className="block text-xs text-muted-foreground mt-0.5">{opt.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}