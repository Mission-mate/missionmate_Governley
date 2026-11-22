import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOOLBAR_SEARCH_INPUT } from '@/components/shared/table/ToolbarButton';
import SortButton from '@/components/shared/SortButton';

const SORT_FIELDS = [{ key: 'page_date', label: 'Date' }];

/** Search-by-title field + Date sort button above the notes table. */
export default function NotesToolbar({ search, onSearchChange, sort, onSortChange, action }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes"
          className={cn(TOOLBAR_SEARCH_INPUT, 'w-56 pr-8')}
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <SortButton fields={SORT_FIELDS} value={sort} onChange={onSortChange} />
      </div>
      {action}
    </div>
  );
}