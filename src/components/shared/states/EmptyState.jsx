import React from 'react';
import { Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared empty-state used across modules.
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title = 'Nothing here yet',
  description = 'Get started by adding your first item.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button size="sm" className="mt-4 rounded-full px-5" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}