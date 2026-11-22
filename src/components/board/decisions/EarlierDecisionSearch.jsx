import React, { useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { formatDate } from '@/lib/meetingActionApi';
import { cn } from '@/lib/utils';

/**
 * Searchable picker for the earlier decision a new one supersedes or rescinds.
 * value: the picked decision's ID; decisions: the other decisions in this register.
 */
export default function EarlierDecisionSearch({ value, decisions, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = decisions.find((d) => d.id === value);
  const text = query.trim().toLowerCase();
  const matches = text ? decisions.filter((d) => d.title?.toLowerCase().includes(text)) : decisions;

  const pick = (decision) => {
    onChange(decision.id);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'w-full flex items-center justify-between gap-2 border rounded-md pl-3 pr-2.5 h-9 text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-ring',
            invalid ? 'border-destructive' : 'border-input'
          )}
        >
          <span className={cn('truncate', selected ? 'text-foreground' : 'text-muted-foreground')}>
            {selected ? selected.title : 'Search earlier decisions'}
          </span>
          <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 z-[120]">
        <div className="p-1.5 border-b border-border">
          <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-2.5 h-8 focus-within:ring-1 focus-within:ring-ring">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search by decision title"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {matches.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">No decisions found.</p>}
          {matches.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => pick(d)}
              className="flex items-center justify-between gap-2 w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm text-foreground truncate">{d.title}</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {[d.decision_type, d.outcome, d.decision_date && formatDate(d.decision_date)].filter(Boolean).join(' · ')}
                </span>
              </span>
              {value === d.id && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}