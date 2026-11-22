import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ARROW = 'flex items-center justify-center rounded text-primary transition-colors hover:text-primary/70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:text-muted-foreground/50 disabled:cursor-default';

/** Rows per page in side-pane folder and file lists. */
export const PAGER_SIZE = 10;

/** Compact pager for side-pane folder and file lists: ‹ Page X of Y ›. */
export default function FolderPager({ page, totalPages, onPageChange }) {
  return (
    <div className="flex items-center gap-2 shrink-0 text-xs">
      <button type="button" aria-label="Previous" className={ARROW} disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
      </button>
      <span className="text-muted-foreground tabular-nums">
        Page <span className="font-semibold text-foreground">{page}</span> of {totalPages}
      </span>
      <button type="button" aria-label="Next" className={ARROW} disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="w-4 h-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}