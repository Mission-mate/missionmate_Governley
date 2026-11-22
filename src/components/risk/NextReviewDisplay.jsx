import React from 'react';
import { cn } from '@/lib/utils';
import { formatReviewDate, daysRemaining } from '@/lib/reviewDateUtils';

/**
 * Displays a next-review date. When the date is in the past (relative to the
 * application's current date) the date turns red and an "Overdue" tag is shown.
 */
export default function NextReviewDisplay({ date, className }) {
  if (!date) return <span className={cn('text-sm text-foreground', className)}>—</span>;

  const remaining = daysRemaining(date);
  const overdue = remaining !== null && remaining < 0;

  return (
    <span className={cn('inline-flex items-center gap-2 text-sm', overdue ? 'text-red-600 font-medium' : 'text-foreground', className)}>
      {formatReviewDate(date)}
      {overdue && (
        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300 font-semibold">Overdue</span>
      )}
    </span>
  );
}