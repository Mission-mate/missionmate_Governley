import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ComposerMetaBar from './ComposerMetaBar';

/**
 * "New task" row (styled like Notes' "New note") that opens a chat-style composer. Sticky to the bottom of the
 * pane's scroll area so it stays in place (just above the pane footer) however long the list is.
 */
export default function ChecklistQuickAdd({ statuses, defaultStatus, onSubmit }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState(defaultStatus);
  const [busy, setBusy] = useState(false);

  const reset = () => { setOpen(false); setTitle(''); setOwner(''); setDate(''); };
  const openComposer = () => { setStatus(defaultStatus); setOpen(true); };
  const submit = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    await onSubmit({ title, owner_name: owner, due_date: date }, status);
    setBusy(false);
    reset();
  };

  if (!open) {
    return (
      <button type="button" onClick={openComposer} className="group relative w-full flex items-center gap-3 px-6 py-3 text-left transition-colors hover:bg-sidebar-accent/70 after:absolute after:bottom-0 after:inset-x-0 after:h-px after:bg-border">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-dashed border-muted-foreground/50 text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
          <Plus className="w-3.5 h-3.5" />
        </span>
        <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">New task</span>
      </button>
    );
  }

  return (
    <div className="sticky bottom-0 z-10 bg-card px-4 pt-3 pb-4">
      <div className="rounded-2xl bg-composer border border-border/60 p-2 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-3 rounded-xl bg-card border border-border px-4 py-3">
          <span className="w-5 h-5 rounded-full border border-dashed border-muted-foreground/50 shrink-0" />
          <input
            autoFocus value={title} onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') reset(); }}
            placeholder="Type task title..."
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/60"
          />
        </div>
        <div className="flex items-center justify-between gap-2 pt-2 pl-2">
          <ComposerMetaBar owner={owner} date={date} status={status} statuses={statuses}
            onOwnerChange={setOwner} onDateChange={setDate} onStatusChange={setStatus} />
          <div className="flex items-center gap-1.5 shrink-0">
            <Button size="sm" variant="ghost" onClick={reset}>Cancel</Button>
            <Button size="sm" onClick={submit} disabled={!title.trim() || busy} className="rounded-lg disabled:opacity-50">{busy ? 'Adding...' : 'Add'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}