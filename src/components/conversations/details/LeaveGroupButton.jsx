import React, { useState } from 'react';
import { LogOut } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';

/** Soft-red Leave group action; leaving needs CONFIRM typed. `onLeave()` resolves once done. */
export default function LeaveGroupButton({ groupName, busy, onLeave }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={busy}
        className="group mt-4 w-full flex items-center justify-center gap-2 h-9 rounded-lg bg-destructive/10 text-destructive text-sm font-semibold transition-all duration-200 hover:bg-destructive/15 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 disabled:opacity-60 disabled:pointer-events-none motion-reduce:transform-none"
      >
        <LogOut className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" strokeWidth={1.8} />
        Leave group
      </button>
      <ConfirmDeleteDialog
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Leave group"
        message={`You’ll stop receiving messages from ${groupName || 'this group'} and lose access to its history until someone adds you back.`}
        requireKeyword="CONFIRM"
        confirmLabel="Leave group"
        busyLabel="Leaving..."
        onConfirm={async () => { await onLeave(); setOpen(false); }}
      />
    </>
  );
}