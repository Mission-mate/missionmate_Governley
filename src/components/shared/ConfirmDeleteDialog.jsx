import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Input } from '@/components/ui/input';

/**
 * Delete confirmation modal. Pass requireKeyword (e.g. "DELETE") to require the
 * user to type it before the destructive button becomes active.
 */
export default function ConfirmDeleteDialog({
  isOpen, title = 'Delete', message, confirmLabel = 'Delete', onConfirm, onClose, overlayClassName = '', requireKeyword = '', busyLabel = 'Deleting...',
}) {
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState('');
  useEffect(() => { if (isOpen) { setBusy(false); setTyped(''); } }, [isOpen]);

  const locked = !!requireKeyword && typed.trim() !== requireKeyword;

  const handle = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-sm" overlayClassName={overlayClassName}>
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2 break-words">{title}</h2>
        <p className="text-sm text-muted-foreground mb-5 break-words">{message}</p>
        {!!requireKeyword && (
          <div className="mb-5">
            <p className="text-sm text-muted-foreground mb-2">
              Type <span className="font-semibold text-foreground">{requireKeyword}</span> to confirm.
            </p>
            <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={requireKeyword} autoFocus />
          </div>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={handle} disabled={busy || locked}>
            {busy ? busyLabel : confirmLabel}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}