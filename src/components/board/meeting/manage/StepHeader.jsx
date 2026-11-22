import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { id: 1, label: 'Attendees' },
  { id: 2, label: 'Attendance' },
];

export default function StepHeader({ currentStep, maxVisited, onStepClick }) {
  return (
    <div className="flex items-center gap-1 px-6 py-4 border-b border-border shrink-0 justify-center">
      {STEPS.map((step, idx) => {
        const isActive = currentStep === step.id;
        const isDone = step.id < currentStep;
        const canClick = true;
        return (
          <React.Fragment key={step.id}>
            <button
              type="button"
              disabled={!canClick}
              onClick={() => canClick && onStepClick(step.id)}
              className={cn(
                'flex items-center gap-2 transition-opacity',
                !canClick && 'opacity-50 cursor-default'
              )}
            >
              <span
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isDone
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : step.id}
              </span>
              <span
                className={cn(
                  'text-sm font-medium',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </button>
            {idx < STEPS.length - 1 && (
              <div className="h-px bg-border mx-2 w-8" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}