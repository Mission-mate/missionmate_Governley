import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'upload', label: 'Upload File' },
  { key: 'map', label: 'Map Columns' },
  { key: 'done', label: 'Complete' },
];

/**
 * Horizontal step tracker for the bulk import flow.
 */
export default function ImportStepper({ current }) {
  const currentIdx = STEPS.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center px-6 py-4 border-b border-border bg-muted/30">
      {STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isActive = idx === currentIdx;
        return (
          <React.Fragment key={step.key}>
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  isDone && 'bg-primary text-primary-foreground',
                  isActive && 'bg-primary text-primary-foreground ring-4 ring-primary/15',
                  !isDone && !isActive && 'bg-muted text-muted-foreground border border-border',
                )}
              >
                {isDone ? <Check className="w-3.5 h-3.5" /> : idx + 1}
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive || isDone ? 'text-foreground' : 'text-muted-foreground',
                )}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={cn('w-10 h-px mx-3', idx < currentIdx ? 'bg-primary' : 'bg-border')} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}