import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

/**
 * Permanent deletion confirmation for strategy items — requires typing DELETE.
 * Pass `item` for a single record, or `count` + `noun` for a selection. Stays
 * open with the error shown if the delete fails, so it can be retried.
 */
export default function DeleteStrategyRowsDialog({ isOpen, item, count = 1, noun = 'record', onClose, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setConfirmText(''); setBusy(false); setError(''); }
  }, [isOpen]);

  const canConfirm = confirmText.trim().toUpperCase() === 'DELETE' && !busy;
  const plural = count !== 1 ? 's' : '';
  const title = item ? `Delete ${noun.toLowerCase()}?` : `Delete ${noun}${plural}`;
  const subject = item
    ? <>the {noun.toLowerCase()} <span className="font-semibold text-foreground">{item.title}</span></>
    : `${count} ${noun.toLowerCase()}${plural}`;

  const handleConfirm = async () => {
    setBusy(true);
    setError('');
    try {
      await onConfirm();
    } catch (e) {
      setError(e?.message || 'Delete failed. Please try again.');
      setBusy(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={busy ? () => {} : onClose} className="w-full max-w-md">
      <div className="bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2 break-words">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete {subject} along with every item beneath it, including their tasks, measure reports, notes and documents. This cannot be recovered.
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
        {error && <p className="text-sm text-destructive -mt-3 mb-4">{error}</p>}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!canConfirm}>
            {busy ? 'Deleting…' : error ? 'Retry' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}