import React from 'react';
import { cn } from '@/lib/utils';

// Compact pill shared by every Program/Project lifecycle status label.
const TONES = {
  active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  completed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  archived: 'bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300',
};

export default function LifecycleStatusPill({ status, className }) {
  const key = status || 'active';
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize whitespace-nowrap', TONES[key] || TONES.active, className)}>
      {key}
    </span>
  );
}