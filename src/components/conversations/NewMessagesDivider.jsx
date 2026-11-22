import React from 'react';

/** Marks where the reader's unread messages begin in a thread. */
export default function NewMessagesDivider() {
  return (
    <div data-new-messages role="separator" aria-label="New messages" className="flex items-center gap-3 py-2 animate-in fade-in duration-300 motion-reduce:animate-none">
      <span className="h-px flex-1 bg-primary/40" />
      <span className="text-[11px] font-bold uppercase tracking-wide text-primary">New messages</span>
      <span className="h-px flex-1 bg-primary/40" />
    </div>
  );
}