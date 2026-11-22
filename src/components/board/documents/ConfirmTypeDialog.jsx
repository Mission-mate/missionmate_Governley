import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

/**
 * Generic confirmation modal that requires typing a keyword (e.g. REMOVE or DELETE).
 */
export default function ConfirmTypeDialog({ isOpen, title, message, keyword = 'DELETE', confirmLabel, confirmVariant = 'destructive', error, onConfirm, onClose, overlayClassName = 'z-[110]' }) {
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (isOpen) { setTyped(''); setBusy(false); } }, [isOpen]);

  const handle = async () => {
    if (typed !== keyword) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      // Always release the button — a failed confirm must not leave it stuck.
      setBusy(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-sm" overlayClassName={overlayClassName}>
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2 break-words">{title}</h2>
        <p className="text-sm text-muted-foreground mb-4 break-words">{message}</p>
        <p className="text-sm text-foreground mb-2">Type <span className="font-bold">{keyword}</span> to confirm.</p>
        <Input value={typed} onChange={e => setTyped(e.target.value)} placeholder={keyword} className="mb-5 text-sm" autoFocus />
        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</p>
        )}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant={confirmVariant} onClick={handle} disabled={typed !== keyword || busy}>
            {busy ? 'Working...' : error ? 'Try again' : (confirmLabel || keyword.charAt(0) + keyword.slice(1).toLowerCase())}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}