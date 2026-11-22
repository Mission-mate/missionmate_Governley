import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

export default function DeleteNoteDialog({ note, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (typed !== 'DELETE') return;
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <ModalOverlay isOpen={!!note} onClose={onCancel} className="w-full max-w-sm">
      <div className="bg-white dark:bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete Note</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This action cannot be undone. This will permanently delete the note.
        </p>
        <p className="text-sm text-foreground mb-2">
          Type <span className="font-bold">DELETE</span> to confirm.
        </p>
        <Input
          value={typed}
          onChange={e => setTyped(e.target.value)}
          placeholder="DELETE"
          className="mb-5 text-sm"
          autoFocus
        />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={typed !== 'DELETE' || deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}