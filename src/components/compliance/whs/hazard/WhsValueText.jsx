import React from 'react';
import { localToday } from '@/lib/localClock';
import { cn } from '@/lib/utils';
import { STATUS_PILL } from '@/lib/whsTabs';

/** Field value text; `overdue` date fields turn red when past and the record isn't Completed/Closed. */
export default function WhsValueText({ field, raw, text, status }) {
  if (field.pill && text) {
    return <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', STATUS_PILL[raw] || 'bg-muted text-muted-foreground')}>{text}</span>;
  }
  const overdue = field.overdue && raw && !['Completed', 'Closed'].includes(status) && raw < localToday();
  if (!overdue) return <>{text || '—'}</>;
  return (
    <span className="text-destructive font-semibold">
      {text}
      <span className="block text-xs font-normal text-destructive">Overdue</span>
    </span>
  );
}