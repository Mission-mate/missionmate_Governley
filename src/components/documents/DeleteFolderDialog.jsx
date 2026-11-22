import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

/** Typed confirmation before a folder and the documents inside it are deleted. */
export default function DeleteFolderDialog({ folder, onConfirm, onCancel }) {
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { setTyped(''); setDeleting(false); }, [folder?.id]);

  const handle = async () => {
    if (typed !== 'DELETE' || deleting) return;
    setDeleting(true);
    try {
      await onConfirm();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ModalOverlay isOpen={!!folder} onClose={deleting ? () => {} : onCancel} className="w-full max-w-sm">
      <div className="bg-card rounded-xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete Folder</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This action cannot be undone. This will permanently delete{' '}
          <span className="font-bold text-foreground">{folder?.name}</span> and all its documents.
        </p>
        <p className="text-sm text-foreground mb-2">Type <span className="font-bold">DELETE</span> to confirm.</p>
        <Input
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder="DELETE"
          className="mb-5 text-sm"
          autoFocus />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onCancel} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handle} disabled={typed !== 'DELETE' || deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}