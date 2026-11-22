import React from 'react';
import { cn } from '@/lib/utils';

/** Pill toggle showing No / Yes inside the track. */
export default function YesNoToggle({ checked, onChange, readOnly }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-readonly={readOnly}
      onClick={readOnly ? undefined : () => onChange(!checked)}
      className={cn(
        'relative h-7 w-[68px] rounded-full transition-colors shrink-0',
        readOnly && 'cursor-default',
        checked ? 'bg-primary' : 'bg-muted-foreground/25'
      )}>
      <span className={cn(
        'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all',
        checked ? 'left-[40px]' : 'left-0.5'
      )} />
      <span className={cn(
        'absolute inset-y-0 flex items-center text-xs font-semibold',
        checked ? 'left-3 text-primary-foreground' : 'right-3 text-foreground/70'
      )}>
        {checked ? 'Yes' : 'No'}
      </span>
    </button>);

}