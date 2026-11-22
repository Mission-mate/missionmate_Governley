import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Shared fallback UI shown when an ErrorBoundary catches a render error.
 */
export default function ErrorFallback({ onRetry, fullPage = false, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        fullPage ? 'min-h-[60vh] py-16' : 'py-14',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground">Something went wrong</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        This section couldn't be displayed. You can try again, or continue using the rest of the page.
      </p>
      {onRetry && (
        <Button className="mt-5" onClick={onRetry}>Retry</Button>
      )}
    </div>
  );
}