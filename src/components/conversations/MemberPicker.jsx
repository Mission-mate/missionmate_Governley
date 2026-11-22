import React, { useMemo, useState } from 'react';
import { Search, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import PersonAvatar from './PersonAvatar';
import { cn } from '@/lib/utils';

/**
 * Searchable list of team members.
 * With `selectedIds`, rows toggle a tick (multi-select); without it, a click simply picks the person.
 */
export default function MemberPicker({ candidates, selectedIds, onPick, disabled = false }) {
  const [search, setSearch] = useState('');
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? candidates.filter((p) => p.name.toLowerCase().includes(q)) : candidates;
  }, [candidates, search]);

  return (
    <div>
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search team members" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="max-h-64 overflow-y-auto -mx-1 px-1 space-y-0.5">
        {visible.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {candidates.length === 0 ? 'No team members available.' : 'No team members match your search.'}
          </p>
        ) : visible.map((person) => {
          const selected = selectedIds?.includes(person.id);
          return (
            <button
              key={person.id}
              type="button"
              disabled={disabled}
              onClick={() => onPick(person.id)}
              className={cn(
                'w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-left transition-colors duration-200 disabled:opacity-60',
                selected ? 'bg-sidebar-accent' : 'hover:bg-muted'
              )}
            >
              <PersonAvatar person={person} />
              <span className="flex-1 min-w-0 text-sm font-medium text-foreground truncate">{person.name}</span>
              {selectedIds && (
                <span className={cn(
                  'w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors duration-200',
                  selected ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/40 text-transparent'
                )}>
                  <Check className="w-3 h-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}