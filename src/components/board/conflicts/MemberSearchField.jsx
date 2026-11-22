import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Check, UserPlus } from 'lucide-react';

/**
 * Hybrid person lookup for Conflict of Interest records.
 * Selecting a committee member returns { user_id, name }.
 * Typing a name with no match lets the user save a free-text person
 * ({ user_id: '', name, manual: true }) for people not in the register.
 */
export default function MemberSearchField({ people = [], value, onSelect, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmed = query.trim();
  const filtered = people.filter((p) =>
    !trimmed || (p.member_name || '').toLowerCase().includes(trimmed.toLowerCase())
  );
  const exactMatch = people.some((p) => (p.member_name || '').toLowerCase() === trimmed.toLowerCase());

  const pick = (p) => {
    onSelect({ user_id: p.user_id, name: p.member_name || '' });
    setOpen(false);
    setQuery('');
  };

  const applyManualName = () => {
    onSelect({ user_id: '', name: trimmed, manual: true });
    setOpen(false);
    setQuery('');
  };

  if (value?.name) {
    return (
      <div className="flex items-center justify-between h-9 w-full rounded-md border border-input bg-white px-3 text-sm">
        <span className="truncate text-foreground">{value.name}</span>
        <span className="flex items-center gap-2 shrink-0 ml-2">
          {!value.user_id && <span className="text-xs text-muted-foreground">Not in register</span>}
          {!disabled && (
            <button type="button" onClick={() => onSelect(null)} className="text-muted-foreground hover:text-destructive">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <input
          value={query}
          disabled={disabled}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === 'Enter' && trimmed && !exactMatch) { e.preventDefault(); applyManualName(); } }}
          placeholder="Search a member or type a new name..."
          className="w-full pl-9 pr-3 h-9 rounded-md border border-input bg-white text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 disabled:opacity-70"
        />
      </div>
      {open && !disabled && (
        <div className="animate-dropdown-enter absolute top-full mt-1 left-0 right-0 z-50 max-h-56 overflow-y-auto bg-white border border-border rounded-lg shadow-lg py-1">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pick(p)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left"
            >
              <span className="min-w-0 truncate text-foreground">{p.member_name}</span>
              {value?.user_id === p.user_id && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
            </button>
          ))}

          {trimmed && !exactMatch && (
            <button
              type="button"
              onClick={applyManualName}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-left border-t border-border"
            >
              <UserPlus className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="min-w-0">
                <span className="block truncate text-foreground">Use "{trimmed}"</span>
                <span className="block text-xs text-muted-foreground">Not a committee member</span>
              </span>
            </button>
          )}

          {!trimmed && filtered.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">Start typing a name</p>
          )}
        </div>
      )}
    </div>
  );
}