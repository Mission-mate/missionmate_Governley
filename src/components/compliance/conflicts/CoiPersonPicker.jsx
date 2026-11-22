import React, { useState, useRef, useEffect } from 'react';
import { Search, Pencil, Trash2 } from 'lucide-react';
import DeleteCoiPersonDialog from './DeleteCoiPersonDialog';
import { cn } from '@/lib/utils';
import CoiPersonCard from './CoiPersonCard';

/**
 * Compliance person lookup: search existing profiles or create a new one.
 * While a person is selected the search is disabled until the card is removed.
 */
export default function CoiPersonPicker({ member, people = [], onChange, readOnly }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [deleting, setDeleting] = useState(null);
  const [editOnOpen, setEditOnOpen] = useState(false);
  const ref = useRef(null);
  const locked = !!member || readOnly;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const trimmed = query.trim();
  const lower = trimmed.toLowerCase();
  const filtered = people.filter((p) => !lower || (p.member_name || '').toLowerCase().includes(lower));
  const choose = (m) => { onChange(m); setOpen(false); setQuery(''); };
  const toMember = (p) => ({ user_id: p.user_id, name: p.member_name, role: p.role, division: p.division, email: p.email });
  const pick = (p, edit = false) => { setEditOnOpen(edit); choose(toMember(p)); };

  return (
    <div className="space-y-3">
      <div className="relative" ref={ref}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
        <input
          value={query}
          disabled={locked}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={member ? 'Remove the selected person to search again' : 'Search existing people...'}
          className={cn('w-full pl-9 pr-3 h-9 rounded-md border border-input bg-white text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50',
            locked && 'bg-muted cursor-not-allowed opacity-60')}
        />
        {open && !locked && (
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 right-0 z-50 max-h-56 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg py-1">
            {filtered.map((p) => (
              <div key={p.id} className="group flex items-center hover:bg-muted/50">
                <button type="button" onClick={() => pick(p)} className="flex-1 min-w-0 px-3 py-2 text-left">
                  <span className="block truncate text-sm text-foreground">{p.member_name}</span>
                  {p.role && <span className="block truncate text-xs text-muted-foreground">{p.role}</span>}
                </button>
                <button type="button" onClick={() => pick(p, true)} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit profile">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => { setOpen(false); setDeleting(toMember(p)); }} className="p-1.5 mr-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" title="Delete profile">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {filtered.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">{trimmed ? 'No matching people' : 'No people yet'}</p>}
          </div>
        )}
      </div>
      {member && <CoiPersonCard key={member.user_id || 'new'} member={member} onChange={onChange} onDelete={setDeleting} readOnly={readOnly} startEditing={editOnOpen} />}
      <DeleteCoiPersonDialog
        person={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={(p) => { if (member?.user_id === p.user_id) onChange(null); }}
      />
    </div>
  );
}