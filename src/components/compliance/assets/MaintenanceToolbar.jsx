import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOOLBAR_SEARCH_INPUT } from '@/components/shared/table/ToolbarButton';
import SortButton from '@/components/shared/SortButton';

const SORT_FIELDS = [{ key: 'date', label: 'Date' }];

/** Search-by-title field + Date sort button + action for the maintenance log. */
export default function MaintenanceToolbar({ search, onSearchChange, sort, onSortChange, action }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search maintenance"
          className={cn(TOOLBAR_SEARCH_INPUT, 'w-56 pr-8')}
        />
        {search && (
          <button type="button" onClick={() => onSearchChange('')} aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <SortButton fields={SORT_FIELDS} value={sort} onChange={onSortChange} />
      {action}
    </div>
  );
}