import React from 'react';
import { List, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const VIEWS = [
  { value: 'list', label: 'List', Icon: List },
  { value: 'charts', label: 'Charts', Icon: BarChart3 },
];

/** Segmented List / Charts view toggle for the Board Matrix tab. */
export default function MatrixViewSwitcher({ value, onChange, className }) {
  return (
    <div role="tablist" aria-label="Board matrix view" className={cn('inline-flex items-center gap-1 rounded-xl bg-muted p-1', className)}>
      {VIEWS.map(({ value: v, label, Icon }) => {
        const active = value === v;
        return (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(v)}
            className={cn(
              'inline-flex items-center gap-2 h-8 px-4 rounded-lg text-sm font-medium transition-colors',
              active
                ? 'bg-[hsl(var(--tab-active))] text-foreground font-semibold shadow-sm dark:shadow-black/30'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}