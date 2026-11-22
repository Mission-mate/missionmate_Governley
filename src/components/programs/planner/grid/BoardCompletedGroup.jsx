import React, { useState } from 'react';
import { ChevronRight, CircleCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';

/** Collapsible "Completed (n)" group at the bottom of a Board section; collapsed by default. */
export default function BoardCompletedGroup({ rows, renderCard }) {
  const [open, setOpen] = useState(false);
  const reveal = useCollapse(open);
  if (!rows.length) return null;
  return (
    <div className="mt-2 pt-2 border-t border-border">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 px-1 py-1.5 w-full text-sm font-medium text-foreground hover:opacity-80">
        <ChevronRight className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-90')} />
        <CircleCheck className="w-4 h-4 text-white fill-emerald-500" />
        Completed
        <span className="min-w-5 h-5 px-1.5 rounded-full bg-card shadow-sm ring-1 ring-border text-xs text-muted-foreground flex items-center justify-center">{rows.length}</span>
      </button>
      {reveal.mounted && <div className={cn(reveal.className, 'flex flex-col gap-2 mt-2')}>{rows.map((r) => <div key={r.id}>{renderCard(r)}</div>)}</div>}
    </div>
  );
}