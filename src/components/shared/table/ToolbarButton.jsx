import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Standard table-toolbar trigger (Group / Filter / Sort / Export).
 * Purely presentational — owns no dropdown state. Each toolbar keeps its own
 * menu and wraps its trigger in this component.
 *
 * Props:
 *  - icon: lucide component, rendered at w-4 h-4
 *  - label: button text
 *  - active: applies the primary tint used when a selection is applied
 *  - badge: optional trailing count node
 */
const ToolbarButton = React.forwardRef(function ToolbarButton(
  { icon: Icon, label, active = false, badge = null, className, children, ...props },
  ref
) {
  return (
    <Button
      ref={ref}
      data-toolbar-control={active ? 'active' : ''}
      variant="outline"
      size="sm"
      className={cn(
        'h-9 gap-2 text-sm font-medium',
        active && 'border-primary/40 bg-primary/5 text-primary',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {label}
      {badge}
      {children}
    </Button>
  );
});

export default ToolbarButton;

/** Shared toolbar search-input styling — keeps the row at a single height. */
export const TOOLBAR_SEARCH_INPUT =
  'h-9 pl-9 pr-3 text-sm bg-background border border-border rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';