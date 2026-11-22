import React from 'react';
import { cn } from '@/lib/utils';
import { sanitizeRiskHtml } from '@/lib/riskHtml';

/**
 * Renders rich-text HTML (from the editor) safely inside compact table cells,
 * so values like "<ul><li>..." display as proper formatted lists instead of raw tags.
 * Falls back to an em-dash when empty.
 */
export default function RichTextCell({ html, className, clamp = 2 }) {
  const isEmpty = !html || !String(html).replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
  if (isEmpty) return <span className="text-muted-foreground/50">—</span>;

  const clampClass =
    clamp === 1 ? 'line-clamp-1' :
    clamp === 3 ? 'line-clamp-3' :
    clamp === 2 ? 'line-clamp-2' : '';

  return (
    <div
      className={cn(
        'text-sm text-foreground rich-text-cell',
        '[&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-0',
        '[&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:my-0',
        '[&_li]:my-0 [&_p]:my-0',
        clampClass,
        className
      )}
      dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(html) }}
    />
  );
}