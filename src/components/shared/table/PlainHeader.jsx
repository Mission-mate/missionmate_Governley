import React from 'react';
import { cn } from '@/lib/utils';
import InfoTooltip from '@/components/risk/InfoTooltip';

/**
 * A simple, non-resizable table header cell.
 * The label may wrap to two lines; an optional tooltip renders an info icon.
 */
export default function PlainHeader({ children, tooltip, className }) {
  return (
    <th
      className={cn(
        'text-left px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide select-none align-middle',
        className
      )}
    >
      <span className="inline-flex items-center gap-1">
        <span>{children}</span>
        {tooltip && <InfoTooltip text={tooltip} />}
      </span>
    </th>
  );
}