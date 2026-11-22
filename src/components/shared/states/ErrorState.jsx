import React from 'react';
import { AlertTriangle, RefreshCw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Shared error-state used across modules.
 * onRetry re-runs the failed request; onRefresh (optional) adds a "Refresh page" action.
 * retrying disables the actions and spins the retry icon while a retry is in flight.
 */
export default function ErrorState({
  title = 'Something went wrong',
  description = 'We couldn’t load this data. Please try again.',
  onRetry,
  onRefresh,
  retrying = false,
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center text-center py-16 px-6">
      <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {(onRetry || onRefresh) && (
        <div className="mt-4 flex items-center gap-2">
          {onRetry && (
            <Button size="sm" variant="outline" className="rounded-full px-5" onClick={onRetry} disabled={retrying}>
              <RotateCw className={retrying ? 'animate-spin' : undefined} />
              {retrying ? 'Retrying…' : 'Try again'}
            </Button>
          )}
          {onRefresh && (
            <Button size="sm" variant="ghost" className="rounded-full px-5" onClick={onRefresh} disabled={retrying}>
              <RefreshCw /> Refresh page
            </Button>
          )}
        </div>
      )}
    </div>
  );
}