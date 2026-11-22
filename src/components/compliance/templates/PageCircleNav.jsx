import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Circle navigation between the two "Add Obligation" pages.
 * Clicking a circle (or its label) switches to that page.
 */
export default function PageCircleNav({ value, onChange, tabs }) {
  return (
    <div className="flex items-center gap-6">
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className="flex items-center gap-2 group"
          >
            <span
              className={cn(
                'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                active ? 'border-primary bg-primary text-primary-foreground' : 'border-input bg-transparent group-hover:border-primary/50'
              )}
            >
              {active && <Check className="h-3 w-3" strokeWidth={3} />}
            </span>
            <span className={cn('text-sm font-medium transition-colors', active ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground')}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}