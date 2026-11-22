import { base44 } from '@/api/base44Client';
import { BOARD_OBJECT_TYPE } from '@/lib/boardDocuments';

/**
 * Shared query options for the Meeting Detail sections. The page prefetches them
 * (so one page-level loader covers the whole load) and each section card reads
 * the same cache entries.
 */
export const meetingDocumentsQuery = (meetingId) => ({
  queryKey: ['meetingDocuments', meetingId],
  queryFn: async () => sortMeetingDocuments(
    await base44.entities.Document.filter({ object_type: BOARD_OBJECT_TYPE, meeting_id: meetingId }, '-created_date')
  ),
  enabled: !!meetingId,
});

/**
 * Display order for meeting documents: documents never moved (no order_index,
 * e.g. just added) first, newest first; then moved ones by their saved position.
 * Expects the input already sorted newest first.
 */
export function sortMeetingDocuments(docs) {
  const unordered = docs.filter(d => typeof d.order_index !== 'number');
  const ordered = docs.filter(d => typeof d.order_index === 'number').sort((a, b) => a.order_index - b.order_index);
  return [...unordered, ...ordered];
}

export const meetingActionLinksQuery = (meetingId) => ({
  queryKey: ['meetingActionRegisterLinks', meetingId],
  queryFn: () => base44.entities.MeetingActionRegisterLink.filter({ meeting_id: meetingId }),
  enabled: !!meetingId,
});

export const meetingParticipantsQuery = (meetingId) => ({
  queryKey: ['meetingParticipants', meetingId],
  queryFn: () => base44.entities.MeetingParticipant.filter({ meeting_id: meetingId }, 'created_date'),
  enabled: !!meetingId,
});