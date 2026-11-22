import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';

export default function DeleteControlDialog({ isOpen, name, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setDeleting(false);
    }
  }, [isOpen]);

  const canDelete = text.trim().toUpperCase() === 'DELETE';

  const handleConfirm = async () => {
    if (!canDelete) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} overlayClassName="z-[60]" className="w-full max-w-md">
      <div className="bg-card rounded-2xl shadow-2xl w-full">
        <div className="flex items-start justify-between px-6 pt-6 pb-2">
          <h2 className="text-lg font-bold text-foreground">Delete control?</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className="px-6 pb-6 pt-2 space-y-4">
          <p className="text-sm text-muted-foreground">
            This will permanently delete{' '}
            {name ? <>the control <span className="font-semibold text-foreground">{name}</span></> : 'this control'}. This action cannot be undone.
          </p>
          <div>
            <label className="text-sm font-medium text-foreground mb-1.5 block">
              Type <span className="font-bold">DELETE</span> to confirm
            </label>
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="DELETE"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirm} disabled={!canDelete || deleting}>
              {deleting ? 'Deleting...' : 'Delete Control'}
            </Button>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}