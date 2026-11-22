import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

/**
 * Confirmation dialog for bulk deletion. Requires typing DELETE to confirm.
 */
export default function BulkDeleteDialog({ isOpen, count, onClose, onConfirm, noun = 'contact' }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setBusy(false);
    }
  }, [isOpen]);

  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE' && !busy;
  const plural = count !== 1 ? 's' : '';

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
    } catch {
      // The caller surfaces the error — keep the dialog open for retry.
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">
          Delete {noun.charAt(0).toUpperCase() + noun.slice(1)}{plural}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete {count} {noun}{plural}? This cannot be recovered.
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
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}