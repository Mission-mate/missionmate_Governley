import React from 'react';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import { localToday } from '@/lib/localClock';
import { formatReviewDate } from '@/lib/complianceRegisters';

/** Term expiry date; red with an "Overdue" label once it is before today (WHS register style). */
export default function TermExpiryDate({ value, status }) {
  if (!value) return '—';
  const overdue = status === 'Current' && value < localToday();
  return (
    <span className={cn('text-sm whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
      {formatReviewDate(value)}
      {overdue && <span className="block text-xs font-normal text-destructive">{overdueLabel(value)}</span>}
    </span>
  );
}