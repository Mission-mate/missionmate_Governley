import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export const CONTRACT_STEPS = ['Contract Details', 'Financials'];

/** Numbered circle stepper (Add New Grant style). Only completed/current steps are clickable. */
export default function ContractStepper({ step, maxStep, onGoTo }) {
  return (
    <div className="flex items-start max-w-xs mx-auto">
      {CONTRACT_STEPS.map((label, i) => {
        const n = i + 1;
        const active = n === step;
        const done = n < step;
        const reachable = n <= maxStep;
        return (
          <React.Fragment key={label}>
            <button type="button" disabled={!reachable} onClick={() => onGoTo(n)}
              className={cn('flex flex-col items-center gap-1.5 w-24 shrink-0', reachable ? 'cursor-pointer' : 'cursor-default')}>
              <span className={cn('w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                active ? 'bg-primary border-primary text-primary-foreground'
                  : done ? 'bg-primary/15 border-primary/40 text-primary'
                  : 'bg-card border-border text-muted-foreground')}>
                {done ? <Check className="w-4 h-4" /> : n}
              </span>
              <span className={cn('text-xs text-center leading-tight', active ? 'text-primary font-semibold' : 'text-muted-foreground')}>{label}</span>
            </button>
            {i < CONTRACT_STEPS.length - 1 && <div className={cn('flex-1 h-0.5 mt-[17px] rounded-full', done ? 'bg-primary/40' : 'bg-border')} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}