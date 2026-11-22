import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Search, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { levelLabel, updateBlock } from '@/lib/strategy';
import { getEnabledLayers, MODULES } from '@/lib/strategyLayers';
import LinkedItemCard from './LinkedItemCard';

/**
 * Connections — Contributes To.
 * Searchable single link to any strategic item on another workspace layer.
 * Only layers enabled in the Customizer are offered; one connection max per row.
 */
export default function ContributesToSection({ item, strategy, blocks, onSaved, hideHeading = false, editing = true, draftValue, onDraftChange }) {
  // When onDraftChange is supplied the section is controlled by the parent and
  // does not persist on its own — the parent's Save Changes writes the value.
  const isDraft = typeof onDraftChange === 'function';
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const wrapRef = useRef(null);

  const allowedLevels = useMemo(
    // Storage slots of the linkable layers, in hierarchy order. The Overview
    // layers (Vision / Focus Areas) hold no records, so they are never targets.
    () =>
      getEnabledLayers(strategy)
        .filter((l) => l.module !== MODULES.OVERVIEW && l.level !== item.level)
        .map((l) => l.level),
    [item.level, strategy]
  );

  const linkedId = isDraft ? draftValue || '' : item.contributes_to || '';
  const linked = blocks.find((b) => b.id === linkedId) || null;

  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return blocks.
    filter((b) => allowedLevels.includes(b.level) && b.id !== item.id).
    filter((b) => !q || b.title.toLowerCase().includes(q) || (b.custom_id || '').toLowerCase().includes(q)).
    sort((a, b) =>
      allowedLevels.indexOf(a.level) - allowedLevels.indexOf(b.level) ||
      (a.order_index || 0) - (b.order_index || 0));
  }, [blocks, allowedLevels, query, item.id]);

  // Close dropdown on outside click.
  useEffect(() => {
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  if (allowedLevels.length === 0) return null;

  const link = async (b) => {
    if (isDraft) {
      onDraftChange(b.id);
      setQuery('');
      setOpen(false);
      return;
    }
    setSaving(true);
    try {
      await updateBlock(item.id, { contributes_to: b.id });
      setQuery('');
      setOpen(false);
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const unlink = async () => {
    if (isDraft) {
      onDraftChange('');
      return;
    }
    setSaving(true);
    try {
      await updateBlock(item.id, { contributes_to: '' });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={hideHeading ? 'space-y-2' : 'border-t border-border pt-4 space-y-2'}>
      {!hideHeading && <h3 className="text-base font-bold text-foreground">Connections</h3>}
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Contributes To</p>

      {!linked &&
      <div className="relative" ref={wrapRef}>
          <Search className="absolute left-3 top-[19px] -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
          placeholder="Link a strategic item this record contributes to"
          className="pl-9 h-10 text-sm file:text-sm md:text-sm"
          value={query}
          disabled={saving}
          onChange={(e) => {setQuery(e.target.value);setOpen(true);}}
          onFocus={() => setOpen(true)} />
        
          {open &&
        <div className="animate-dropdown-enter absolute left-0 right-0 top-11 z-50 bg-popover border border-border rounded-lg shadow-lg max-h-56 overflow-y-auto">
              {candidates.length === 0 ?
          <p className="text-sm text-muted-foreground px-3 py-3">No matching items found.</p> :

          candidates.map((b) =>
          <button
            key={b.id}
            onClick={() => link(b)}
            disabled={saving}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors border-b border-border/60 last:border-b-0">
            
                    <Link2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide shrink-0">
                      {levelLabel(strategy, b.level)}
                    </span>
                    {b.custom_id &&
            <span className="text-[11px] font-medium text-muted-foreground shrink-0">{b.custom_id}</span>
            }
                    <span className="text-sm font-medium text-foreground truncate">{b.title}</span>
                  </button>
          )
          }
            </div>
        }
        </div>
      }

      {linked && <LinkedItemCard block={linked} strategy={strategy} onUnlink={editing ? unlink : undefined} disabled={saving} />}
    </div>);

}