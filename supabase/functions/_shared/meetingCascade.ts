/**
 * Shared cascade used when a board Meeting is removed, so both the single-meeting
 * delete endpoint and the legacy undated-meeting cleanup behave identically and
 * never leave child rows orphaned behind a deleted meeting.
 *
 * Blocked first: if non-governance documents are still attached the meeting is
 * left completely untouched — governance records (agendas, minutes) must be
 * removed or reassigned deliberately, never silently lost.
 *
 * Cascade order when clear (each stage completes before the next):
 *   1. MeetingParticipant  { meeting_id }       — attendance is meaningless without the meeting
 *   2. MeetingActionRegisterLink { meeting_id }  — only the link, never the register
 *   3. MeetingActionItem   { meeting_id }       — unlinked (meeting_id cleared), never deleted
 *   4. Decision            { meeting_id }       — unlinked (meeting_id cleared), never deleted
 *   5. Meeting itself
 *
 * MeetingActionRegister (and its actions, notes and tasks) are deliberately
 * preserved: registers exist independently of any single meeting.
 */
export type MeetingCascadeResult =
  | { ok: true; deleted_participants: number; deleted_register_links: number; unlinked_actions: number }
  | { ok: false; reason: 'not_found' }
  | {
      ok: false;
      reason: 'documents_attached';
      document_count: number;
      document_titles: string[];
    };

export async function cascadeDeleteMeeting(
  svc: any,
  meetingId: string
): Promise<MeetingCascadeResult> {
  const meeting = await svc.Meeting.get(meetingId).catch(() => null);
  if (!meeting) return { ok: false, reason: 'not_found' };

  // Governance docs live under a folder, not a meeting, so they are excluded
  // even in the unlikely case one carries a stale meeting_id.
  const linkedDocs = await svc.Document.filter({ meeting_id: meetingId });
  const blockingDocs = linkedDocs.filter((d: any) => d.board_category !== 'governance');

  if (blockingDocs.length > 0) {
    return {
      ok: false,
      reason: 'documents_attached',
      document_count: blockingDocs.length,
      document_titles: blockingDocs.slice(0, 5).map((d: any) => d.title).filter(Boolean),
    };
  }

  const participants = await svc.MeetingParticipant.filter({ meeting_id: meetingId });
  if (participants.length > 0) {
    await svc.MeetingParticipant.deleteMany({ meeting_id: meetingId });
  }

  const registerLinks = await svc.MeetingActionRegisterLink.filter({ meeting_id: meetingId });
  if (registerLinks.length > 0) {
    await svc.MeetingActionRegisterLink.deleteMany({ meeting_id: meetingId });
  }

  // Unlink actions that point at this meeting. Their title, committee and date are
  // read from the Meeting, so clearing the link leaves no stale title or open icon.
  let unlinkedActions = 0;
  let more = true;
  while (more) {
    const res = await svc.MeetingActionItem.updateMany(
      { meeting_id: meetingId },
      { $set: { meeting_id: '' } }
    );
    unlinkedActions += res?.updated ?? res?.modified ?? 0;
    more = res?.has_more === true;
  }

  // Decisions linked to this meeting are unlinked the same way; their decision date is kept.
  more = true;
  while (more) {
    const res = await svc.Decision.updateMany(
      { meeting_id: meetingId },
      { $set: { meeting_id: '' } }
    );
    more = res?.has_more === true;
  }

  await svc.Meeting.delete(meetingId);

  return {
    ok: true,
    deleted_participants: participants.length,
    deleted_register_links: registerLinks.length,
    unlinked_actions: unlinkedActions,
  };
}