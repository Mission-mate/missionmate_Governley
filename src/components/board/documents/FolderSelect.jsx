import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';
import FolderIcon from '@/components/documents/FolderIcon';
import { cn } from '@/lib/utils';

/**
 * Folder picker — button trigger opening a dropdown whose first row is a search
 * bar, followed by the filtered list of colour-coded folders.
 */
export default function FolderSelect({ folders = [], value, onSelect }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const selected = folders.find(f => f.id === value);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const filtered = search.trim()
    ? folders.filter(f => f.name.toLowerCase().includes(search.trim().toLowerCase()))
    : folders;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 w-full h-11 px-3 border border-input rounded-md bg-transparent text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring transition-colors"
      >
        {selected && <FolderIcon color={selected.color} size={20} />}
        <span className={cn('flex-1 min-w-0 truncate text-left', selected ? 'text-foreground font-medium' : 'text-muted-foreground')}>
          {selected ? selected.name : 'Select a folder'}
        </span>
        {selected && (
          <span
            role="button"
            tabIndex={-1}
            onClick={(e) => { e.stopPropagation(); onSelect(''); setSearch(''); }}
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        <ChevronDown className="w-4 h-4 text-muted-foreground opacity-50 shrink-0" />
      </button>

      {open && (
        <div className="animate-dropdown-enter absolute left-0 right-0 top-full mt-1 z-50 bg-popover border border-input rounded-md shadow-md overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-2.5 h-8 focus-within:ring-1 focus-within:ring-ring">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search folders..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="max-h-52 overflow-y-auto">
            {folders.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground text-center">No folders created yet.</p>
            ) : filtered.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground text-center">No folders found.</p>
            ) : filtered.map(f => {
              const isSel = f.id === value;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => { onSelect(f.id); setSearch(''); setOpen(false); }}
                  className={cn('flex items-center gap-2.5 w-full px-3 py-2.5 text-left hover:bg-primary/10 transition-colors', isSel && 'bg-primary/[0.08]')}
                >
                  <Check className={cn('w-4 h-4 shrink-0', isSel ? 'text-primary' : 'text-transparent')} />
                  <FolderIcon color={f.color} size={20} />
                  <span className={cn('text-sm flex-1 min-w-0 truncate', isSel ? 'text-primary font-medium' : 'text-foreground')}>
                    {f.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}