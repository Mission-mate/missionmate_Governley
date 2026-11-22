import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import usePillTransition from '@/hooks/usePillTransition';

const PERIODS = [
  { value: 'month', label: 'Month' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'year', label: 'Year' },
];

/** Month/Quarter/Year switcher that sets the work plan's period grouping. Box-shaped, sized to match the full CapsuleTabs control. */
export default function PeriodTabs({ value, onChange }) {
  const pillId = `period-pill-${useId()}`;
  const { transition, arm } = usePillTransition();

  return (
    <div role="tablist" className="inline-flex items-center gap-1 p-1 rounded-lg bg-muted shrink-0">
      {PERIODS.map((p) => {
        const active = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => { arm(); onChange(p.value); }}
            className={cn(
              'relative h-8 px-4 rounded-md text-sm transition-colors duration-200 motion-reduce:transition-none',
              active ? 'text-primary font-semibold' : 'text-muted-foreground font-medium hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                layoutDependency={value}
                className="absolute inset-0 rounded-md bg-[hsl(var(--tab-active))] shadow-sm ring-1 ring-border/60 dark:shadow-black/30"
                transition={transition}
              />
            )}
            <span className="relative">{p.label}</span>
          </button>
        );
      })}
    </div>
  );
}