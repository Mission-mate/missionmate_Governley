import React, { useState } from 'react';
import { Search, Check, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { formatPeriod, startYearFromDate } from '@/lib/financialYear';
import { cn } from '@/lib/utils';

/**
 * Searchable picker for the work plan register to clone from
 * (both Active and Archived plans).
 */
export default function WorkPlanSourceSelect({ plans, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const selected = plans.find((p) => p.id === value);

  const results = plans.filter((p) => (p.title || '').toLowerCase().includes(query.trim().toLowerCase()));

  if (selected && !open) {
    return (
      <button
        type="button"
        onClick={() => { setOpen(true); setQuery(''); }}
        className="w-full flex items-center justify-between gap-2 h-9 rounded-md border border-input bg-transparent px-3 text-sm text-left"
      >
        <span className="truncate text-foreground">{selected.title}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
      </button>
    );
  }

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Select an Existing Work Plan to Clone"
          className="pl-9"
        />
      </div>

      {open && (
        <div className="animate-dropdown-enter mt-1.5 max-h-52 overflow-y-auto rounded-md border border-border divide-y divide-border">
          {results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">No work plans found.</p>
          ) : (
            results.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => { onChange(p.id); setOpen(false); }}
                className="w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-center gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(p.status || 'active') === 'archived' ? 'Archived' : 'Active'}
                    {p.financial_year_start && ` · ${formatPeriod(p.compliance_period_type, startYearFromDate(p.financial_year_start))}`}
                  </p>
                </div>
                <Check className={cn('w-4 h-4 text-primary shrink-0', p.id === value ? 'opacity-100' : 'opacity-0')} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}