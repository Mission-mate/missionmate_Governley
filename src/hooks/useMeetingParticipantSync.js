import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { syncMeetingParticipants, invalidateParticipants } from '@/lib/meetingParticipants';
import { toast } from '@/components/ui/use-toast';

/**
 * Reconciles a meeting's participants against its committee — on first load and
 * again whenever the committee changes. Returns true while a sync (and the
 * participant re-fetch that follows it) is in progress.
 */
export default function useMeetingParticipantSync(meeting) {
  const qc = useQueryClient();
  const [syncing, setSyncing] = useState(true);

  useEffect(() => {
    if (!meeting?.id) return;
    setSyncing(true);
    syncMeetingParticipants(meeting)
      .then((res) => {
        const failedCount = res?.failedCount || 0;
        if (failedCount > 0) {
          toast({
            variant: 'destructive',
            title: 'Some attendees could not be updated',
            description: `${failedCount} attendee${failedCount === 1 ? '' : 's'} couldn't be updated. Reopen this meeting to try again.`,
          });
        }
      })
      .catch(() => {})
      .then(() => invalidateParticipants(qc))
      .catch(() => {})
      .then(() => setSyncing(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meeting?.id, meeting?.committee_id]);

  return syncing;
}