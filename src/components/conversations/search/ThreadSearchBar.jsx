import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import IconTip from '@/components/shared/IconTip';
import { cn } from '@/lib/utils';

const STEP_BUTTON = 'w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors duration-200 disabled:opacity-40 disabled:pointer-events-none';

/**
 * Inline search under the thread header. Enter jumps to the next (older) match, Shift+Enter
 * to the previous one, Escape closes. `search` comes from useMessageSearch.
 */
export default function ThreadSearchBar({ search, hasMore, loadingOlder, onLoadOlder }) {
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);
  const { query, term, total, position } = search;

  const onKeyDown = (e) => {
    if (e.key === 'Escape') search.close();
    if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) search.previous(); else search.next(); }
  };

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 overflow-hidden border-b border-border bg-card"
    >
      <div className="flex items-center gap-2 px-4 md:px-5 py-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 h-9 rounded-full bg-muted/60 px-3.5 ring-1 ring-transparent focus-within:ring-primary/40 focus-within:bg-background transition-all duration-200">
          <Search className="w-4 h-4 shrink-0 text-muted-foreground" strokeWidth={1.8} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => search.setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search in this conversation"
            className="flex-1 min-w-0 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {term && (
            <span className={cn('shrink-0 text-xs tabular-nums', total ? 'text-muted-foreground' : 'text-destructive')}>
              {total ? `${position} of ${total}` : 'No matches'}
            </span>
          )}
        </div>
        <IconTip label="Older match">
          <button type="button" onClick={search.next} disabled={total < 2} className={STEP_BUTTON}>
            <ChevronUp className="w-4 h-4" strokeWidth={2} />
            <span className="sr-only">Older match</span>
          </button>
        </IconTip>
        <IconTip label="Newer match">
          <button type="button" onClick={search.previous} disabled={total < 2} className={STEP_BUTTON}>
            <ChevronDown className="w-4 h-4" strokeWidth={2} />
            <span className="sr-only">Newer match</span>
          </button>
        </IconTip>
        <IconTip label="Close search">
          <button type="button" onClick={search.close} className={STEP_BUTTON}>
            <X className="w-4 h-4" strokeWidth={2} />
            <span className="sr-only">Close search</span>
          </button>
        </IconTip>
      </div>
      {term && hasMore && (
        <p className="px-4 md:px-5 pb-2 -mt-0.5 text-[11px] text-muted-foreground">
          Searching loaded messages.{' '}
          <button type="button" onClick={onLoadOlder} disabled={loadingOlder} className="font-medium text-primary hover:underline disabled:opacity-60">
            {loadingOlder ? 'Loading...' : 'Load earlier messages'}
          </button>
        </p>
      )}
    </motion.div>
  );
}