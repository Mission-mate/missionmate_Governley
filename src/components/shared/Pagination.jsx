import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { cn } from '@/lib/utils';

/**
 * Full pagination control with page-size selector and numbered pages.
 *
 * Props:
 *  - page (1-based), totalPages, total, pageSize, onPageChange, onPageSizeChange
 *  - pageSizeOptions (default [50, 100, 200])
 */
export default function Pagination({
  page, totalPages = 1, total = 0, pageSize = 50,
  onPageChange, onPageSizeChange,
  pageSizeOptions = [50, 100, 200],
}) {
  // Build a compact list of page numbers around the current page.
  const pages = [];
  const add = (p) => { if (!pages.includes(p) && p >= 1 && p <= totalPages) pages.push(p); };
  add(1);
  for (let p = page - 1; p <= page + 1; p++) add(p);
  add(totalPages);
  pages.sort((a, b) => a - b);

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 pt-4">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{start}–{end} of {total}</span>
        <div className="flex items-center gap-1.5">
          <span>Show</span>
          <Select value={String(pageSize)} onValueChange={(v) => onPageSizeChange(Number(v))}>
            <SelectTrigger className="h-8 w-[72px] rounded-lg border-border bg-card px-2.5 text-xs text-foreground shadow-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="min-w-[72px] rounded-xl border-border/70 shadow-lg">
              {pageSizeOptions.map((opt) => (
                <SelectItem
                  key={opt}
                  value={String(opt)}
                  className="rounded-lg px-2.5 text-xs data-[state=checked]:bg-primary/10"
                >
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {pages.map((p, i) => {
          const prev = pages[i - 1];
          const gap = prev && p - prev > 1;
          return (
            <React.Fragment key={p}>
              {gap && <span className="px-1 text-muted-foreground text-sm">…</span>}
              <button
                onClick={() => onPageChange(p)}
                className={cn(
                  'h-8 min-w-8 px-2 rounded-md text-sm font-medium transition-colors',
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent border border-border'
                )}
              >
                {p}
              </button>
            </React.Fragment>
          );
        })}

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 rounded-md"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}