import React from 'react';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';

/** Compact find box with match count ("1 of 3") and previous/next arrows. */
export default function ViewerSearchBar({ query, setQuery, total, current, onStep, disabled }) {
  return (
    <div className={`flex h-8 w-[220px] items-center gap-1 rounded-[7px] border border-border bg-muted/40 pl-2.5 pr-1 focus-within:ring-1 focus-within:ring-ring ${disabled ? 'opacity-60' : ''}`}>
      <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      <input value={query} disabled={disabled} onChange={(e) => setQuery(e.target.value)} placeholder="Find in document..."
        onKeyDown={(e) => e.key === 'Enter' && onStep(e.shiftKey ? -1 : 1)}
        className="min-w-0 flex-1 bg-transparent text-xs text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed" />
      {query && <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">{total ? `${current + 1} of ${total}` : '0 of 0'}</span>}
      {query && <button type="button" title="Clear" onClick={() => setQuery('')} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>}
      <button type="button" title="Previous match" disabled={!total} onClick={() => onStep(-1)} className="p-0.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronUp className="w-3.5 h-3.5" /></button>
      <button type="button" title="Next match" disabled={!total} onClick={() => onStep(1)} className="p-0.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40"><ChevronDown className="w-3.5 h-3.5" /></button>
    </div>
  );
}