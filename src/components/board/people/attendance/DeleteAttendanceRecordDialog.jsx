import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { useToast } from '@/components/ui/use-toast';
import { invalidateParticipants } from '@/lib/meetingParticipants';

/**
 * Type-to-confirm deletion of a person's full attendance history plus their
 * board person record. Only reachable once the committee-register check passes.
 */
export default function DeleteAttendanceRecordDialog({ row, isOpen, onClose }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [confirm, setConfirm] = useState('');

  useEffect(() => { if (isOpen) setConfirm(''); }, [isOpen]);

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('deleteAttendanceRecord', { board_person_id: row.id });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['boardPeople'] });
      invalidateParticipants(qc);
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['memberSkills'] });
      toast({ title: 'Attendance record deleted', description: `${row.member_name}'s attendance history was permanently removed.` });
      onClose();
    },
    onError: (err) => {
      const code = err?.response?.data?.error;
      toast({
        title: code === 'still_in_committee_register' ? 'Still in Committee Register' : 'Could not delete record',
        description: code === 'still_in_committee_register'
          ? 'Remove this person from the Committee Register first.'
          : (err?.response?.data?.error || err?.message || 'Please try again.'),
        variant: 'destructive',
      });
    },
  });

  if (!row) return null;
  const canDelete = confirm.trim() === 'DELETE';

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card w-[28rem] max-w-[92vw] rounded-2xl shadow-xl border border-border p-6">
        <h2 className="font-bold text-lg text-foreground mb-3">Delete attendance record</h2>
        <p className="text-sm text-muted-foreground mb-4">
          This permanently deletes the entire attendance history of{' '}
          <span className="font-medium text-foreground">{row.member_name}</span> across all meetings, along with
          their person record. This cannot be undone.
        </p>
        <div className="space-y-1.5 mb-5">
          <Label>Type <span className="font-semibold">DELETE</span> to confirm</Label>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" disabled={!canDelete || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Delete
          </Button>
        </div>
      </div>
    </ModalOverlay>
  );
}