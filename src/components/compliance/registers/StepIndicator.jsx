import React from 'react';
import { cn } from '@/lib/utils';

const STEPS = [
  { n: 1, label: 'Type' },
  { n: 2, label: 'Details' },
];

export default function StepIndicator({ step, maxStep, onGoTo, steps = STEPS, className = 'mb-6' }) {
  return (
    <div className={cn('flex items-center justify-center gap-3', className)}>
      {steps.map((s, i) => {
        const isActive = s.n === step;
        const isDone = s.n < step;
        const isReachable = s.n <= maxStep;
        return (
          <React.Fragment key={s.n}>
            <button
              onClick={() => isReachable && onGoTo(s.n)}
              disabled={!isReachable}
              className={cn('flex items-center gap-2 transition-opacity', !isReachable ? 'opacity-40 cursor-default' : 'cursor-pointer')}
            >
              <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                isActive ? 'bg-primary text-white' : isDone ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>
                {s.n}
              </div>
              <span className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
            </button>
            {i < steps.length - 1 && <div className={cn('h-px w-10', s.n < step ? 'bg-primary' : 'bg-border')} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}