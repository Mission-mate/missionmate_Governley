import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Searchable application-user picker.
 * onChange receives the selected user object.
 * `excludeIds` hides users already chosen.
 */
export default function UserSearch({ value, onChange, excludeIds = [], placeholder = 'Search by name or email...' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const { data: users = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: () => base44.entities.User.list(),
  });

  const filtered = users
    .filter(u => !excludeIds.includes(u.id))
    .filter(u => {
      const q = query.toLowerCase();
      return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
    });

  const handleSelect = (u) => {
    onChange(u);
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
        <span className={cn(!value && 'text-muted-foreground')}>
          {value ? (value.full_name || value.email) : placeholder}
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
                  placeholder="Search users..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filtered.length === 0 && (
                <p className="px-3 py-2 text-xs text-muted-foreground">No users found.</p>
              )}
              {filtered.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleSelect(u)}
                  className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-primary/10 transition-colors text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{u.full_name || u.email}</span>
                    {u.full_name && <span className="block truncate text-xs text-muted-foreground">{u.email}</span>}
                  </span>
                  {value?.id === u.id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}