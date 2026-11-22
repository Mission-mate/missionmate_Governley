import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Center-aligned circular step indicator — completed steps show a checkmark,
 * the current step shows its number inside a halo ring, upcoming steps are grey.
 */
export default function CircleStepper({ steps, current, onStepClick }) {
  return (
    <div className="flex items-center justify-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <React.Fragment key={label}>
            {i > 0 && (
              <div className={cn('h-[2px] w-10 mx-2.5 rounded-full', i <= current ? 'bg-primary' : 'bg-border')} />
            )}
            <button type="button" disabled={!onStepClick} onClick={() => onStepClick?.(i)}
              className={cn('flex items-center gap-2.5 disabled:cursor-default', onStepClick && 'cursor-pointer hover:opacity-80 transition-opacity')}>
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                  done && 'bg-primary text-primary-foreground',
                  active && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                  !done && !active && 'bg-muted text-muted-foreground/60'
                )}
              >
                {done ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
              </div>
              <span className={cn('text-sm font-medium', done || active ? 'text-foreground' : 'text-muted-foreground/70')}>
                {label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}