import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';

export default function DeleteStrategyDialog({ strategy, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => { if (strategy) setConfirmText(''); }, [strategy]);

  const handleConfirm = async () => {
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalOverlay isOpen={!!strategy} onClose={onClose} className="w-full max-w-md">
      <div className="bg-background rounded-2xl shadow-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Delete strategy?</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              This will permanently delete <span className="font-semibold text-foreground">{strategy?.title}</span> and
              everything in it, including tasks, measure reports, notes and documents. This action cannot be undone.
            </p>
          </div>
          <CloseButton onClick={onClose} className="mt-0.5" />
        </div>

        <div className="px-6 py-2">
          <Label className="mb-1.5 block text-sm">
            Type <span className="font-semibold text-foreground">DELETE</span> to confirm
          </Label>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            autoFocus
          />
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4">
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={deleting || confirmText !== 'DELETE'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}