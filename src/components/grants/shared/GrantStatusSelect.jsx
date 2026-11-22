import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

// Same colours used for status pills in the grant table view.
const GRANT_STATUS_STYLES = {
  active: 'bg-green-50 text-green-700 border border-green-200',
  closed: 'bg-blue-50 text-blue-700 border border-blue-200',
  archived: 'bg-amber-50 text-amber-700 border border-amber-200',
};

const OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'closed', label: 'Closed' },
];

function StatusPill({ value }) {
  const label = OPTIONS.find((o) => o.value === value)?.label || value;
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-medium', GRANT_STATUS_STYLES[value] || GRANT_STATUS_STYLES.active)}>
      {label}
    </span>
  );
}

export default function GrantStatusSelect({ value = 'active', onChange, className }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('text-sm', className)}>
        <SelectValue asChild><StatusPill value={value} /></SelectValue>
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            <StatusPill value={o.value} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}