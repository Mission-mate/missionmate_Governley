import React from 'react';
import { cn } from '@/lib/utils';
import { statusTone } from '@/lib/obligationTasks';

/** Coloured status pill — no dot, app option-colour palette. */
export default function TaskStatusPill({ status, className }) {
  const tone = statusTone(status);
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap', tone.bg, tone.text, className)}>
      {status}
    </span>
  );
}