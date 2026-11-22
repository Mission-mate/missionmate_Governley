import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

/**
 * Delete a GrantProvider / GrantActivity. Requires typing DELETE.
 * Blocked while the record is still linked to grants.
 */
export default function GrantLookupDeleteDialog({ isOpen, record, entityLabel, linkedCount, onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setBusy(false);
    }
  }, [isOpen]);

  const blocked = linkedCount > 0;
  const canConfirm = !blocked && confirmText.trim().toUpperCase() === 'DELETE' && !busy;

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md" overlayClassName="z-[130]">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete {entityLabel}</h2>
        {blocked ? (
          <p className="text-sm text-muted-foreground mb-5">
            <span className="font-semibold text-foreground">{record?.name}</span> is linked to {linkedCount} grant{linkedCount !== 1 ? 's' : ''} and cannot be deleted. Reassign those grants first.
          </p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Permanently delete <span className="font-semibold text-foreground">{record?.name}</span>? This cannot be recovered.
            </p>
            <p className="text-sm text-foreground mb-2">Type <span className="font-bold">DELETE</span> to confirm.</p>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              autoComplete="off"
              autoFocus
              className="mb-5 text-sm"
            />
          </>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>{blocked ? 'Close' : 'Cancel'}</Button>
          {!blocked && (
            <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
              {busy ? 'Deleting…' : 'Delete'}
            </Button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}