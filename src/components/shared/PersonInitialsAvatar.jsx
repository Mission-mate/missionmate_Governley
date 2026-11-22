import React from 'react';
import { cn } from '@/lib/utils';
import { initialsOf } from '@/lib/initials';

/**
 * Fixed periwinkle initials circle used in person list tables (contacts, members).
 * Purely presentational — initials are derived client-side from the name already loaded.
 */
export default function PersonInitialsAvatar({ name, className }) {
  const initials = initialsOf(name);
  return (
    <span
      aria-hidden="true"
      className={cn(
        'shrink-0 inline-flex items-center justify-center rounded-full h-9 w-9 text-xs font-semibold tracking-wide bg-[#E8EDF7] text-[#3F5798] dark:bg-primary/20 dark:text-primary-foreground',
        className
      )}
    >
      {initials || '–'}
    </span>
  );
}