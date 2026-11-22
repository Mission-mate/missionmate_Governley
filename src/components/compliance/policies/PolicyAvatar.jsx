import React from 'react';
import { cn } from '@/lib/utils';

/** Circle with the document title's first letter. */
export default function PolicyAvatar({ title, small, className }) {
  return (
    <span className={cn('rounded-full bg-primary/10 text-primary font-semibold flex items-center justify-center shrink-0',
      small ? 'w-7 h-7 text-xs' : 'w-8 h-8 text-sm', className)}>
      {(title || '?').trim().charAt(0).toUpperCase()}
    </span>
  );
}