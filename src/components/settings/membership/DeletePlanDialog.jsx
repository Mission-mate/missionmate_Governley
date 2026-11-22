import React, { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';

export default function DeletePlanDialog({ isOpen, plan, memberCount = 0, checkingMembers = false, onClose, onConfirm }) {
  const [text, setText] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { if (isOpen) { setText(''); setDeleting(false); } }, [isOpen]);

  // A plan still referenced by members cannot be deleted — those members would
  // be left pointing at a plan that no longer exists.
  const blocked = memberCount > 0 || checkingMembers;
  const confirmed = !blocked && text.trim().toUpperCase() === 'DELETE';

  const handleConfirm = async () => {
    if (!confirmed) return;
    setDeleting(true);
    try { await onConfirm(); }
    finally { setDeleting(false); }
  };

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose} className="w-full max-w-md">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl p-6">
        <h2 className="text-lg font-bold text-foreground mb-2">Delete Membership Plan</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete {plan?.name || 'this plan'}? This cannot be recovered.
        </p>

        {memberCount > 0 && (
          <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 dark:bg-red-500/10 px-3 py-2.5 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400">
              {memberCount} member{memberCount === 1 ? ' is' : 's are'} on this plan — reassign
              {memberCount === 1 ? ' them' : ' them'} to another plan before deleting.
            </p>
          </div>
        )}

        <p className="text-sm text-foreground mb-2">Type <span className="font-bold">DELETE</span> to confirm.</p>
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="DELETE"
          autoComplete="off"
          autoFocus
          disabled={blocked}
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