import React, { useId, useState } from 'react';
import { motion } from 'framer-motion';
import { List, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import usePillTransition from '@/hooks/usePillTransition';

const OPTIONS = [
  { id: 'list', label: 'List', Icon: List },
  { id: 'charts', label: 'Charts', Icon: BarChart3 },
];

/**
 * Icon switcher between views (task list / charts, planner board / list, table / charts).
 * The selected pill springs to the chosen view (shared layoutId), label colours fade
 * in step, and the pill dips to 0.97 while pressed. Instant under reduced motion.
 */
export default function TaskViewToggle({ value, onChange, options = OPTIONS }) {
  const pillId = `view-pill-${useId()}`;
  const { transition, arm, reduceMotion } = usePillTransition();
  const [pressed, setPressed] = useState(false);
  const release = () => setPressed(false);

  return (
    <div role="tablist" className="inline-flex items-center gap-1 rounded-lg bg-muted p-1">
      {options.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            title={label}
            aria-label={label}
            role="tab"
            aria-selected={active}
            onClick={() => { arm(); onChange(id); }}
            onPointerDown={() => { arm(); setPressed(true); }}
            onPointerUp={release}
            onPointerLeave={release}
            onPointerCancel={release}
            className={cn(
              'relative h-7 px-2.5 flex items-center gap-1.5 justify-center rounded-md text-xs font-medium transition-colors duration-200 motion-reduce:transition-none',
              active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                animate={{ scale: pressed && !reduceMotion ? 0.97 : 1 }}
                transition={transition}
                className="absolute inset-0 rounded-md bg-card shadow-sm dark:shadow-black/30"
              />
            )}
            <span className={cn(
              'relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-200 motion-reduce:transition-none',
              active && 'bg-primary/10 text-primary'
            )}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            <span className="relative z-10 text-sm font-body font-normal">{label}</span>
          </button>
        );
      })}
    </div>
  );
}