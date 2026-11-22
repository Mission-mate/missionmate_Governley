import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export const OBLIGATION_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started', badge: 'bg-gray-100 text-gray-600' },
  { value: 'in_progress', label: 'In Progress', badge: 'bg-amber-100 text-amber-700' },
  { value: 'complete', label: 'Completed', badge: 'bg-green-100 text-green-700' },
];

export function StatusPill({ option }) {
  if (!option) return null;
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', option.badge)}>
      {option.label}
    </span>
  );
}

export default function ObligationStatusSelect({ value, onChange, error, disabled, className }) {
  const selected = OBLIGATION_STATUS_OPTIONS.find((o) => o.value === value);

  return (
    <Select value={value || ''} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn('bg-white', error && 'border-destructive focus:ring-destructive', className)}>
        {selected ? <StatusPill option={selected} /> : <SelectValue placeholder="Select status" />}
      </SelectTrigger>
      <SelectContent>
        {OBLIGATION_STATUS_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <StatusPill option={o} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}