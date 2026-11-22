import React, { useId } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import usePillTransition from '@/hooks/usePillTransition';

const ACTIVE_SURFACE = 'bg-[hsl(var(--tab-active))] shadow-sm dark:shadow-black/30';
// Opt-in `raised` look: the active capsule sits a pixel above the track with a soft layered shadow and a blue label.
// The lift sits on the tab itself, so the sliding pill never carries a transform of its own.
const RAISED_LIFT = '-translate-y-px';
const RAISED_SURFACE = 'bg-[hsl(var(--tab-active))] ring-1 ring-foreground/[0.04] shadow-[0_1px_2px_rgba(15,23,42,0.06),0_3px_8px_rgba(15,23,42,0.08)] dark:ring-white/[0.06] dark:shadow-[0_1px_2px_rgba(0,0,0,0.4),0_4px_10px_rgba(0,0,0,0.35)]';

/**
 * Capsule-style segmented tab switcher.
 * Default: simple active-background style — no shared-layout animation.
 * `animated`: opt-in spring-sliding pill (Framer Motion layoutId). The pill only
 * moves when the selected tab changes, so it is safe inside sliding panes and modals.
 * tabs: array of { value, label, count? }
 */
export default function CapsuleTabs({ tabs, value, onChange, className, tabClassName, size = 'default', showZeroCount = false, animated = false, raised = false }) {
  const surface = raised ? RAISED_SURFACE : ACTIVE_SURFACE;
  const sm = size === 'sm';
  const pillId = `capsule-pill-${useId()}`;
  const { transition, arm } = usePillTransition();

  return (
    <div role="tablist" className={cn('inline-flex items-center gap-1 rounded-full bg-muted', sm ? 'p-0.5' : 'p-1', className)}>
      {tabs.map((t) => {
        const active = value === t.value;
        return (
          <button
            key={t.value || 'all'}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => { if (animated) arm(); onChange(t.value); }}
            className={cn(
              'relative flex items-center gap-1.5 rounded-full font-medium motion-reduce:transition-none',
              raised ? 'transition-[color,background-color,box-shadow,transform] duration-200 ease-out' : 'transition-colors duration-200',
              sm ? 'px-3.5 h-8 text-[13px]' : 'px-4 h-8 text-sm',
              active ? cn('font-semibold', raised ? 'text-primary' : 'text-foreground') : 'text-muted-foreground hover:text-foreground',
              active && raised && RAISED_LIFT,
              active && !animated && surface,
              tabClassName
            )}>
            {active && animated &&
              <motion.span
                layoutId={pillId}
                layoutDependency={value}
                transition={transition}
                className={cn('absolute inset-0 rounded-full', surface)} />
            }
            <span className="relative z-10">{t.label}</span>
            {t.count != null && (showZeroCount || t.count > 0) &&
              <span className={cn(
                'relative z-10 min-w-[20px] h-5 px-1 rounded-full inline-flex items-center justify-center text-[11px] leading-none font-medium tabular-nums transition-colors duration-200 motion-reduce:transition-none',
                active ? 'bg-primary/15 text-primary dark:text-primary-foreground' : 'bg-background text-muted-foreground'
              )}>
                {t.count}
              </span>
            }
          </button>
        );
      })}
    </div>
  );
}