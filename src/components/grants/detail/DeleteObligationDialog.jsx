import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

export default function DeleteObligationDialog({ isOpen, onClose, onConfirm, title }) {
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (!isOpen) { setText(''); setDeleting(false); } }, [isOpen]);

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-white rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete Reporting Obligation</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This will permanently delete <span className="font-semibold text-foreground">"{title}"</span>. This cannot be undone.
        </p>
        <p className="text-sm text-muted-foreground mb-2">Type <span className="font-semibold text-foreground">DELETE</span> to confirm.</p>
        <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="DELETE" className="mb-5" />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={text !== 'DELETE' || deleting}
            onClick={async () => { setDeleting(true); await onConfirm(); setDeleting(false); }}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}