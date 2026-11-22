import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

// Lets the admin pick which membership structures appear on the public form,
// and (for selected structures) attach conditional visibility logic.
export default function StructureSelector({ structures, selectedIds, onToggle, onEditLogic, hasLogicFor, gridClassName }) {
  if (structures.length === 0) {
    return (
      <div className="border border-dashed border-border rounded-lg py-8 text-center text-sm text-muted-foreground">
        No membership plans yet. Create one under the Membership Plan tab first.
      </div>
    );
  }

  return (
    <div className={cn('grid gap-3', gridClassName || 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3')}>
      {structures.map((s) => {
        const checked = selectedIds.includes(s.id);
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onToggle(s.id)}
            className={cn(
              'text-left flex items-start gap-3 px-3 py-3 rounded-lg border transition-colors',
              checked ? 'border-primary bg-primary/5' : 'border-transparent bg-card shadow-sm hover:border-primary/40'
            )}
          >
            <span className={cn(
              'w-5 h-5 rounded flex items-center justify-center shrink-0 border mt-0.5',
              checked ? 'bg-primary border-primary text-primary-foreground' : 'border-input'
            )}>
              {checked && <Check className="w-3.5 h-3.5" />}
            </span>
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground truncate">{s.name}</span>
                {checked && (
                  <span className="inline-flex items-center shrink-0 rounded-full border border-green-500/30 bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-600">
                    Active
                  </span>
                )}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}