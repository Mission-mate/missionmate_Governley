import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * "Show this question based on the membership plan selected."
 * Admin chooses All plans, or a subset. An empty selection means All plans.
 *
 *  plans:    [{ id, name }]
 *  selected: array of plan ids (empty = all)
 *  onChange: (nextArray) => void
 */
export default function PlanVisibilitySelector({ plans = [], selected = [], onChange }) {
  const allPlans = !selected || selected.length === 0;

  const toggle = (id) => {
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : [...selected, id];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium text-foreground">Question Visibility by Membership Plan</p>
        <p className="text-xs text-muted-foreground mt-0.5">Choose which membership plans will display this question</p>
      </div>

      {/* All plans option */}
      <button
        type="button"
        onClick={() => onChange([])}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors',
          allPlans ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent bg-card text-muted-foreground hover:border-primary/30'
        )}
      >
        <span className={cn('w-4 h-4 rounded-full border flex items-center justify-center shrink-0', allPlans ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
          {allPlans && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
        </span>
        Show for all membership plans
      </button>

      {/* Specific plans */}
      <button
        type="button"
        onClick={() => { if (allPlans && plans[0]) onChange([plans[0].id]); }}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors',
          !allPlans ? 'border-primary bg-primary/5 text-foreground' : 'border-transparent bg-card text-muted-foreground hover:border-primary/30'
        )}
      >
        <span className={cn('w-4 h-4 rounded-full border flex items-center justify-center shrink-0', !allPlans ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
          {!allPlans && <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
        </span>
        Show only for selected plans
      </button>

      {!allPlans && (
        <div className="pl-2 space-y-1.5 pt-1">
          {plans.length === 0 && (
            <p className="text-xs text-muted-foreground">No membership plans are exposed on this form yet.</p>
          )}
          {plans.map((p) => {
            const on = selected.includes(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm text-left transition-colors',
                  on ? 'border-primary/40 bg-primary/5' : 'border-transparent bg-card hover:border-primary/30'
                )}
              >
                <span className={cn('w-4 h-4 rounded border flex items-center justify-center shrink-0', on ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
                  {on && <Check className="w-3 h-3" />}
                </span>
                <span className="truncate text-foreground">{p.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}