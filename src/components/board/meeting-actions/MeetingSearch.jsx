import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { searchMeetings, formatDate } from '@/lib/meetingActionApi';
import { cn } from '@/lib/utils';

/**
 * Searchable picker for a meeting created on the Meetings page.
 * value: { id, title } of the linked meeting; onChange receives the picked
 * Meeting record, or null when the link is cleared.
 */
export default function MeetingSearch({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [term, setTerm] = useState('');

  // Search runs on the server once typing pauses.
  useEffect(() => {
    const t = setTimeout(() => setTerm(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  const { data: meetings = [], isLoading, isError } = useQuery({
    queryKey: ['meetingSearch', term],
    queryFn: () => searchMeetings(term),
    enabled: open,
    placeholderData: (prev) => prev,
  });

  const pick = (meeting) => {
    onChange(meeting);
    setOpen(false);
    setQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 border border-input rounded-md pl-3 pr-2.5 h-9 text-sm bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <span className={cn('truncate', value?.id ? 'text-foreground pr-5' : 'text-muted-foreground')}>
              {value?.id ? value.title : 'Search by title or date'}
            </span>
            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />
          </button>
        </PopoverTrigger>
        {value?.id && (
          <button
            type="button"
            onClick={() => onChange(null)}
            title="Remove meeting"
            className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 z-[120]">
        <div className="p-1.5 border-b border-border">
          <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-2.5 h-8 focus-within:ring-1 focus-within:ring-ring">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              className="flex-1 min-w-0 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              placeholder="Search by title or date"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {isLoading && <p className="px-3 py-2 text-xs text-muted-foreground">Loading meetings...</p>}
          {isError && <p className="px-3 py-2 text-xs text-destructive">Couldn’t load meetings. Please try again.</p>}
          {!isLoading && !isError && meetings.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted-foreground">No meetings found.</p>
          )}
          {meetings.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => pick(m)}
              className="flex items-center justify-between gap-2 w-full px-3 py-2 text-left hover:bg-primary/10 transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm text-foreground truncate">{m.title}</span>
                <span className="block text-xs text-muted-foreground truncate">
                  {[m.meeting_date && formatDate(m.meeting_date), m.committee_name].filter(Boolean).join(' · ')}
                </span>
              </span>
              {value?.id === m.id && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}