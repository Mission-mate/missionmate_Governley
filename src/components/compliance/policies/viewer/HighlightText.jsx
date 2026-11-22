import React from 'react';
import { cn } from '@/lib/utils';

/** Renders text with search matches wrapped in <mark>; `offset` gives global match numbering. */
export default function HighlightText({ text, regex, offset, current }) {
  if (!regex) return text;
  const parts = text.split(regex);
  let n = offset;
  return parts.map((p, i) => {
    if (i % 2 === 0) return <React.Fragment key={i}>{p}</React.Fragment>;
    const idx = n++;
    return (
      <mark key={i} data-m={idx}
        className={cn('rounded px-0.5 text-foreground', idx === current ? 'bg-amber-400 ring-2 ring-amber-500 dark:bg-amber-500/70' : 'bg-amber-200 dark:bg-amber-500/30')}>
        {p}
      </mark>
    );
  });
}