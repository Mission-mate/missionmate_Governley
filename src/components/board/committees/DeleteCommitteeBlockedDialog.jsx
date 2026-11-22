import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Loader2, Users, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CommitteeSearch from '@/components/board/CommitteeSearch';
import { reassignCommitteeMeetings } from '@/lib/committeesApi';

/**
 * Shown when a permanent delete is blocked. Members must be removed manually;
 * linked meetings can be bulk-reassigned to another active committee here.
 */
export default function DeleteCommitteeBlockedDialog({ committee, blockers, isOpen, onClose, onResolved }) {
  const qc = useQueryClient();
  const [showReassign, setShowReassign] = useState(false);
  const [target, setTarget] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) { setShowReassign(false); setTarget(null); setError(''); }
  }, [isOpen]);

  const reassign = useMutation({
    mutationFn: () => reassignCommitteeMeetings(committee.id, target),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['meetings'] });
      onResolved();
    },
    onError: (err) => setError(err?.message || 'Could not reassign the meetings. Please try again.')
  });

  if (!committee || !blockers) return null;
  const { memberCount = 0, meetingCount = 0 } = blockers;

  return (
    <ModalOverlay isOpen={isOpen} onClose={onClose}>
      <div className="bg-card w-[28rem] max-w-[92vw] rounded-2xl shadow-xl border border-border p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="font-bold text-lg">Cannot Delete Committee</h2>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          <span className="font-medium text-foreground">{committee.name}</span> still has linked records.
          You can archive it instead to retire it while keeping all past information.
        </p>

        <div className="space-y-2 mb-5">
          {memberCount > 0 && (
            <div className="flex items-start gap-3 rounded-lg border border-border p-3">
              <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm text-foreground">
                <span className="font-medium">{memberCount} member{memberCount === 1 ? '' : 's'}</span> assigned.
                Remove them from this committee first.
              </p>
            </div>
          )}
          {meetingCount > 0 && (
            <div className="rounded-lg border border-border p-3">
              <div className="flex items-start gap-3">
                <CalendarDays className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  <span className="font-medium">{meetingCount} meeting{meetingCount === 1 ? '' : 's'}</span> linked.
                  Reassign them to another committee first.
                </p>
              </div>
              {showReassign ? (
                <div className="mt-3 space-y-1.5">
                  <Label>Move meetings to</Label>
                  <CommitteeSearch value={target} onChange={setTarget} excludeId={committee.id} />
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowReassign(true)}>
                  Reassign meetings
                </Button>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-xs text-destructive mb-3">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Close</Button>
          {showReassign && meetingCount > 0 && (
            <Button disabled={!target?.id || reassign.isPending} onClick={() => reassign.mutate()}>
              {reassign.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reassign {meetingCount} meeting{meetingCount === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}