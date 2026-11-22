import React from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * Inline fallback for a single table row that failed to render.
 * Renders a real <tr> so the <tbody> markup stays valid.
 *
 * Props:
 * - colSpan: number of columns this cell must span
 * - onRetry: the owning ErrorBoundary's retry callback
 * - leading: optional node rendered in its own leading <td> (e.g. a select checkbox)
 */
export default function ErrorRowFallback({ colSpan, onRetry, leading }) {
  return (
    <tr className="bg-muted/20">
      {leading != null && (
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>{leading}</td>
      )}
      <td colSpan={colSpan} className="px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>This row couldn't be displayed.</span>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRetry(); }}
              className="font-medium text-primary hover:underline"
            >
              Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}