import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CommitteeSearch({ value, onChange, excludeId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: committees = [] } = useQuery({
    queryKey: ['committees'],
    queryFn: () => base44.entities.Committee.list(),
  });

  // Archived committees are retired — they never appear as a pick target, so no
  // new meeting can be created against one. An existing (possibly archived)
  // value still renders as the button label below.
  const filtered = committees.filter(c =>
    c.status !== 'archived' &&
    c.id !== excludeId &&
    c.name?.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (c) => {
    onChange({ id: c.id, name: c.name });
    setOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-input rounded-md px-3 h-9 text-sm bg-transparent focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <span className={cn(!value?.name && 'text-muted-foreground')}>
          {value?.name || 'Select a committee...'}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 right-0 bg-popover border border-input rounded-md shadow-md z-50 py-1">
            <div className="p-1.5 border-b border-border">
              <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-2.5 h-8 focus-within:ring-1 focus-within:ring-ring">
                <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
                  placeholder="Search committee name..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No committees found.</p>
              )}
              {filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelect(c)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-primary/10 transition-colors"
                >
                  {c.name}
                  {value?.id === c.id && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}