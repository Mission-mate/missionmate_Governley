import { useRef } from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { meetingDocumentsQuery, meetingActionLinksQuery, meetingParticipantsQuery } from '@/lib/meetingProfileQueries';
import useMeetingParticipantSync from '@/hooks/useMeetingParticipantSync';
import { getOrNull, loadFailure } from '@/lib/readState';

/**
 * Loads everything the Meeting Detail page shows — the meeting, the current user,
 * every section's data and the initial participant sync — and reports `ready`
 * only once all of it has finished, so the page shows a single loader.
 * `ready` latches per meeting, so later refetches/re-syncs never re-cover the page.
 */
export default function useMeetingProfileData(id) {
  const meQuery = useQuery({ queryKey: ['me'], queryFn: () => base44.auth.me() });
  const meetingQuery = useQuery({
    queryKey: ['meeting', id],
    queryFn: () => getOrNull(() => base44.entities.Meeting.get(id)),
  });
  const meeting = meetingQuery.data;

  const sections = useQueries({
    queries: [meetingDocumentsQuery(meeting?.id), meetingActionLinksQuery(meeting?.id), meetingParticipantsQuery(meeting?.id)],
  });
  const syncing = useMeetingParticipantSync(meeting);

  const loaded = !meQuery.isLoading && !meetingQuery.isLoading
    && (!meeting || (sections.every((q) => !q.isPending) && !syncing));

  const readyFor = useRef(null);
  if (loaded) readyFor.current = id;

  return {
    meeting,
    currentUser: meQuery.data,
    syncing,
    ready: readyFor.current === id,
    failure: loadFailure(meetingQuery, ...sections),
  };
}