import React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  Draft: 'bg-gray-100 text-gray-700 dark:bg-gray-400/15 dark:text-gray-300',
  'Under Review': 'bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300',
  Approved: 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  Withdrawn: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  Superseded: 'bg-violet-100 text-violet-700 dark:bg-violet-400/15 dark:text-violet-300',
  active: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  archived: 'bg-muted text-muted-foreground',
  Public: 'bg-teal-100 text-teal-700 dark:bg-teal-400/15 dark:text-teal-300',
  Internal: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  Restricted: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
};
const LABELS = { active: 'Active', archived: 'Archived' };

/** Coloured label for Policy Stage, Status and Classification values. */
export default function PolicyBadge({ value, className }) {
  if (!value) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <span className={cn('inline-flex text-xs font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap', TONES[value] || TONES.Draft, className)}>
      {LABELS[value] || value}
    </span>
  );
}