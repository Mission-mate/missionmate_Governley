import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, Check, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ToolbarButton from '@/components/shared/table/ToolbarButton';

const SORT_FIELDS = [
  { key: 'start_date_sort', label: 'Start Date' },
  { key: 'expiration_date_sort', label: 'Expiration Date' },
];

// Direction rows — "Oldest to Newest" (asc) and "Newest to Oldest" (desc).
function DirectionRow({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between pl-6 pr-3 py-2 hover:bg-muted/50 transition-colors text-left"
    >
      <span className="text-sm text-foreground flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-primary" /> {label}
      </span>
      {active && <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />}
    </button>
  );
}

export default function MemberSortButton({ filters, setFilters }) {
  const [open, setOpen] = useState(false);

  const setSort = (key, dir) => {
    setFilters((prev) => ({
      ...prev,
      start_date_sort: key === 'start_date_sort' ? (prev.start_date_sort === dir ? null : dir) : null,
      expiration_date_sort: key === 'expiration_date_sort' ? (prev.expiration_date_sort === dir ? null : dir) : null,
    }));
  };

  const activeCount = (filters.start_date_sort ? 1 : 0) + (filters.expiration_date_sort ? 1 : 0);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <ToolbarButton icon={ArrowUpDown} label="Sort" active={activeCount > 0} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-60 p-0">
        <div className="px-3 py-2.5 border-b border-border">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Sort By</span>
        </div>
        <div className="py-1">
          {SORT_FIELDS.map((f) => {
            const current = filters[f.key];
            return (
              <div key={f.key} className="py-1">
                <div className="px-3 py-1.5 text-sm font-semibold text-foreground">{f.label}</div>
                <DirectionRow
                  label="Oldest to Newest" icon={ArrowUp}
                  active={current === 'asc'}
                  onClick={() => setSort(f.key, 'asc')} />
                <DirectionRow
                  label="Newest to Oldest" icon={ArrowDown}
                  active={current === 'desc'}
                  onClick={() => setSort(f.key, 'desc')} />
              </div>
            );
          })}
          {activeCount > 0 && (
            <>
              <div className="border-t border-border mt-1" />
              <button
                onClick={() => setFilters((prev) => ({ ...prev, start_date_sort: null, expiration_date_sort: null }))}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 hover:bg-muted/50 transition-colors text-left text-sm text-destructive"
              >
                <X className="w-3.5 h-3.5" /> Clear Sort
              </button>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}