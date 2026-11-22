import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/** Select whose options render as coloured labels. options: strings or { value, label }. */
export default function OptionSelect({ value, onChange, options, placeholder = 'Select...', styleFn, invalid }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className={cn(invalid && 'border-destructive')}><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {options.map((o) => {
          const v = typeof o === 'string' ? o : o.value;
          const label = typeof o === 'string' ? o : o.label;
          return (
            <SelectItem key={v} value={v}>
              <span className={cn(styleFn && 'inline-flex text-xs font-medium rounded-full px-2 py-0.5', styleFn?.(v))}>{label}</span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}