import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Default filter panel footer for the whole application:
 * Clear — white/outline button that turns grey on hover.
 * Apply — small primary button, optionally showing the active filter count.
 */
export default function FilterFooter({ onClear, onApply, count = 0, className }) {
  return (
    <div className={cn('border-t border-border p-2 flex items-center gap-2', className)}>
      <Button size="sm" variant="outline" className="h-8 flex-1 text-xs font-medium text-foreground" onClick={onClear}>
        Clear
      </Button>
      <Button size="sm" className="h-8 flex-1 text-xs font-medium" onClick={onApply}>
        Apply{count > 0 ? ` (${count})` : ''}
      </Button>
    </div>
  );
}