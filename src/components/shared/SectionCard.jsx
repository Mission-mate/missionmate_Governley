import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared section wrapper for view/edit panes across all modules.
 * Matches the Board Actions Register pane sections: soft muted card with an
 * optional uppercase title above the grouped fields.
 */
export default function SectionCard({ title, children, className }) {
  return (
    <div className={cn('rounded-xl p-4 bg-[hsl(var(--muted))]', className)}>
      {title && (
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {title}
        </p>
      )}
      {children}
    </div>
  );
}