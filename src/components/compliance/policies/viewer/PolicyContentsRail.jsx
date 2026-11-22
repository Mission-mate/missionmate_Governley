import React, { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const EASE = 'duration-300 ease-in-out motion-reduce:transition-none';

/** Collapsible numbered section list; starts collapsed as a narrow rail and animates open/closed. */
export default function PolicyContentsRail({ sections, active, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <nav className={cn('hidden md:flex flex-col shrink-0 overflow-hidden border-r border-border bg-muted/30 py-3 transition-[width]', EASE, open ? 'w-[190px]' : 'w-11')}>
      <div className={cn('flex items-center mb-2 transition-[padding]', EASE, open ? 'justify-between pl-5 pr-3' : 'justify-center px-0')}>
        <p className={cn('text-[11px] font-semibold uppercase tracking-[0.11em] text-muted-foreground whitespace-nowrap transition-opacity', EASE, open ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden')}>Contents</p>
        <button type="button" title={open ? 'Collapse contents' : 'Expand contents'} aria-expanded={open} onClick={() => setOpen((o) => !o)}
          className="shrink-0 p-1.5 rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
          <PanelLeft className="w-4 h-4" />
        </button>
      </div>
      <div aria-hidden={!open} inert={open ? undefined : ''}
        className={cn('w-[190px] flex-1 min-h-0 overflow-y-auto px-3 transition-[opacity,transform]', EASE, open ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none')}>
        {sections.map((s, i) => (
          <button key={i} type="button" onClick={() => onSelect(i)}
            className={cn('w-full flex gap-2.5 text-left rounded-md px-2 py-1.5 text-[13px] leading-snug transition-colors',
              active === i ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
            <span className="tabular-nums opacity-70">{i + 1}</span><span className="min-w-0">{s.heading.replace(/^\d+[.)]?\s*/, '')}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}