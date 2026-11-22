import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Small curved tail at a bubble's bottom corner, filled with the bubble's colour.
 * `mine` points it right; otherwise it points left toward the sender's avatar.
 */
export default function BubbleTail({ mine }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 12 16"
      className={cn(
        'absolute bottom-0 w-3 h-4 pointer-events-none',
        mine ? '-right-2 text-primary' : '-left-2 -scale-x-100 text-muted'
      )}
    >
      <path d="M0 0C0 8 4 13.5 12 16H0Z" fill="currentColor" />
    </svg>
  );
}