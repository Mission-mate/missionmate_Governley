import React from 'react';
import { initialsOf } from '@/lib/initials';

/** Displays a person's name with a colored initials circle, like the profile lists. */
export default function PersonCell({ name, size = 'default' }) {
  if (!name || !String(name).trim()) return <span className="text-muted-foreground/50 text-sm">—</span>;
  const sm = size === 'sm';
  return (
    <div className="flex items-center gap-2">
      <div className={`${sm ? 'w-5 h-5 text-[9px]' : 'w-7 h-7 text-[11px]'} rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold shrink-0`}>
        {initialsOf(name)}
      </div>
      <span className={`${sm ? 'text-xs' : 'text-sm'} text-foreground truncate`}>{name}</span>
    </div>);

}