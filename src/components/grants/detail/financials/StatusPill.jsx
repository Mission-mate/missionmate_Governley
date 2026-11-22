import React from 'react';
import { cn } from '@/lib/utils';

export const STATUS_OPTIONS = [
  { value: 'received', label: 'Received', className: 'bg-green-100 text-green-700' },
  { value: 'scheduled', label: 'Scheduled', className: 'bg-blue-100 text-blue-700' },
  { value: 'overdue', label: 'Overdue', className: 'bg-red-100 text-red-700' },
];

/** Read-only coloured status pill. */
export default function StatusPill({ status = 'scheduled' }) {
  const current = STATUS_OPTIONS.find(o => o.value === status) || STATUS_OPTIONS[1];
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium', current.className)}>
      {current.label}
    </span>
  );
}