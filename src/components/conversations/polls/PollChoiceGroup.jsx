import React from 'react';
import { cn } from '@/lib/utils';

/**
 * A titled set of pick-one cards for a poll setting.
 * options: [{ value, label, description, icon }]
 */
export default function PollChoiceGroup({ title, options, value, onChange, className }) {
  return (
    <div>
      <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
      <div role="radiogroup" aria-label={title} className={cn('grid gap-2', className)}>
        {options.map(({ value: optionValue, label, description, icon: Icon }) => {
          const active = optionValue === value;
          return (
            <button
              key={optionValue}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(optionValue)}
              className={cn(
                'rounded-xl border p-3 text-left transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out motion-reduce:transition-none',
                active
                  ? 'border-primary bg-card ring-1 ring-primary shadow-md -translate-y-0.5 motion-reduce:translate-y-0'
                  : 'border-border hover:border-primary/40 hover:bg-muted/60'
              )}
            >
              <span className={cn(
                'w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors duration-200',
                active ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              )}>
                <Icon className="w-4 h-4" strokeWidth={2} />
              </span>
              <span className="block text-sm font-semibold text-foreground">{label}</span>
              <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}