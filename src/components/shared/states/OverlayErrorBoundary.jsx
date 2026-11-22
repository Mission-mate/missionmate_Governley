import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ErrorBoundary from './ErrorBoundary';

/**
 * Local render-error boundary for overlay content (modals, slide panes, sheets).
 *
 * Keeps a failed render contained inside the overlay instead of letting it
 * bubble to the page boundary — an abrupt page teardown can skip Radix's
 * body-lock cleanup and leave the page unclickable. The overlay's own chrome
 * (close button, backdrop) sits outside this boundary and stays interactive.
 */
export default function OverlayErrorBoundary({ children, onClose }) {
  return (
    <ErrorBoundary
      fallback={() => (
        <div className="flex flex-col items-center justify-center text-center px-6 py-12">
          <div className="w-11 h-11 rounded-full bg-muted flex items-center justify-center mb-3">
            <AlertTriangle className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Something went wrong</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            This couldn't be displayed. Close and try again — the rest of the page is unaffected.
          </p>
          {onClose && (
            <Button variant="outline" className="mt-5" onClick={onClose}>Close</Button>
          )}
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
}