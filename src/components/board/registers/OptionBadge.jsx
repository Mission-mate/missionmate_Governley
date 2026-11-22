import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Uniform option/status/priority badge used everywhere a labeled value renders.
 * All badges share the exact same shape, padding, height, and typography so
 * "Critical", "In Progress", etc. all look identical regardless of text length.
 */
export default function OptionBadge({ label, bg, text, className }) {
  if (label === null || label === undefined || label === '') return null;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center h-6 px-2.5 rounded-md text-xs font-medium leading-none whitespace-nowrap',
        bg || 'bg-muted',
        text || 'text-muted-foreground',
        className
      )}
    >
      {label}
    </span>
  );
}