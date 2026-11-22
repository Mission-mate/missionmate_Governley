import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Edit-mode picker for one attribute category.
 * single → radio-style pills (picking replaces); multi → toggle pills.
 * selectedIds: option ids currently chosen; onChange(nextIds)
 */
export default function AttributeCategorySection({ category, options, selectedIds, onChange }) {
  const single = category.cardinality === 'single';
  const toggle = (id) => {
    const has = selectedIds.includes(id);
    if (single) return onChange(has ? [] : [id]);
    onChange(has ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  };

  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-xs text-muted-foreground">{category.name}</p>
        <span className="text-[10px] text-muted-foreground/70">{single ? 'Select one' : 'Select any'}</span>
      </div>
      {options.length === 0 ? (
        <p className="text-sm text-muted-foreground">No options configured. Add some in Customise.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map((o) => {
            const active = selectedIds.includes(o.id);
            return (
              <button key={o.id} type="button" onClick={() => toggle(o.id)}
                className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm transition-colors',
                  active ? 'bg-primary/10 border-primary/50 text-primary font-medium' : 'border-border bg-background text-foreground hover:bg-primary/5 hover:border-primary/40')}>
                {active && <Check className="w-3.5 h-3.5" />} {o.name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}