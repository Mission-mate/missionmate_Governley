import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

export default function DeleteSubmissionDialog({ isOpen, submission, count = 1, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (isOpen) { setText(''); setDeleting(false); } }, [isOpen]);

  const confirmed = text.trim().toUpperCase() === 'DELETE';

  const handleConfirm = async () => {
    if (!confirmed) return;
    setDeleting(true);
    try { await onConfirm(); }
    finally { setDeleting(false); }
  };

  const target = count > 1
    ? `${count} submissions`
    : (submission?.member_name ? `the submission from ${submission.member_name}` : 'this submission');

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">
          {count > 1 ? 'Delete Submissions' : 'Delete Submission'}
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete {target}? This cannot be recovered.
        </p>
        <p className="text-sm text-foreground mb-2">Type <span className="font-bold">DELETE</span> to confirm.</p>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          autoFocus
          className="mb-5 text-sm"
        />
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!confirmed || deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}