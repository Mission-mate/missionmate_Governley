import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Circular expand/collapse handle pinned to the left edge of the deliverable
 * detail pane. Arrow points left to widen the pane, right to shrink it back.
 */
export default function PaneExpandToggle({ expanded, onToggle, className }) {
  const Icon = expanded ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onToggle}
      title={expanded ? 'Collapse pane' : 'Expand pane'}
      className={cn(
        'absolute -left-4 -bottom-4 z-10 w-8 h-8 rounded-full bg-muted text-foreground shadow-lg ring-1 ring-border flex items-center justify-center hover:bg-muted/80 transition-colors',
        className
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={3} />
    </button>
  );
}