import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { deleteCommittee } from '@/lib/committeesApi';

export default function DeleteCommitteeDialog({ committee, isOpen, onClose }) {
  const qc = useQueryClient();
  const [typed, setTyped] = useState('');

  useEffect(() => { if (isOpen) setTyped(''); }, [isOpen]);

  const mutation = useMutation({
    mutationFn: () => deleteCommittee(committee.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committees'] });
      qc.invalidateQueries({ queryKey: ['committeeMember'] });
      onClose();
    },
  });

  if (!committee) return null;
  const confirmed = typed.trim().toLowerCase() === 'delete';

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card w-[26rem] max-w-[92vw] rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h2 className="font-bold text-lg">Delete Committee</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Permanently delete <span className="font-medium text-foreground">{committee.name}</span>?
          This cannot be undone.
        </p>
        <p className="text-sm text-foreground mb-2">Type <span className="font-bold">Delete</span> to confirm.</p>
        <Input value={typed} onChange={e => setTyped(e.target.value)} placeholder="DELETE" className="mb-5 text-sm" autoFocus />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!confirmed || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}