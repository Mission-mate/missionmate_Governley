import { base44 } from '@/api/base44Client';
import { isUpcoming } from '@/lib/boardMeetings';

export const ATTENDANCE_STATUSES = [
  { value: 'invited', label: 'Invited', color: 'text-primary', bg: 'bg-primary/10', dot: 'bg-primary' },
  { value: 'present', label: 'Present', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-500/15', dot: 'bg-green-600' },
  { value: 'apology', label: 'Apology', color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/15', dot: 'bg-amber-500' },
  { value: 'absent', label: 'Absent', color: 'text-destructive', bg: 'bg-destructive/10', dot: 'bg-destructive' },
];

/**
 * Single chokepoint for refreshing participant data after any mutation.
 *
 * Invalidates the ['meetingParticipants'] PREFIX — which covers every
 * per-meeting ['meetingParticipants', id] key without the caller needing to
 * know which meetings were touched — plus the aggregate
 * ['allMeetingParticipants'] key the Attendance tab reads. Routing all
 * mutations through here makes it structurally impossible for the per-meeting
 * lists and the attendance stats to drift out of sync.
 */
export function invalidateParticipants(qc) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ['meetingParticipants'] }),
    qc.invalidateQueries({ queryKey: ['allMeetingParticipants'] }),
  ]);
}

export function statusConfig(value) {
  return ATTENDANCE_STATUSES.find(s => s.value === value) || ATTENDANCE_STATUSES[0];
}

/**
 * Reconcile participant records against the meeting's committee.
 *
 * Adds a participant for every committee member who isn't one yet (existing
 * participants keep their status). For an UPCOMING meeting it also removes
 * stale committee-sourced participants who are no longer members of the
 * meeting's current committee — so changing a meeting's committee re-rosters
 * it. Manually added participants are never removed, and for PAST meetings
 * nothing is removed at all, preserving the historical attendance record.
 *
 * Creates are best-effort: a failed create is counted, not thrown, and the
 * function always re-reads the list afterwards. Safe to re-run — the next call
 * re-creates anything still missing.
 *
 * @returns {Promise<{ participants: Array, failedCount: number }>}
 */
export async function syncMeetingParticipants(meeting) {
  const [participants, committeeMembers, boardPeople] = await Promise.all([
    base44.entities.MeetingParticipant.filter({ meeting_id: meeting.id }),
    meeting.committee_id
      ? base44.entities.CommitteeMember.filter({ committee_id: meeting.committee_id })
      : Promise.resolve([]),
    base44.entities.BoardPerson.list(),
  ]);

  // Map user_id -> BoardPerson to resolve board_person_id for older member
  // records that were saved without it.
  const personByUserId = new Map(boardPeople.map(p => [p.user_id, p]));

  const existingUserIds = new Set(participants.map(p => p.user_id));
  const toCreate = committeeMembers
    .filter(cm => !existingUserIds.has(cm.user_id))
    .map(cm => {
      const person = personByUserId.get(cm.user_id);
      const boardPersonId = cm.board_person_id || person?.id;
      if (!boardPersonId) return null;
      return {
        meeting_id: meeting.id,
        committee_id: meeting.committee_id,
        board_person_id: boardPersonId,
        user_id: cm.user_id,
        member_name: cm.member_name,
        member_email: cm.member_email,
        position: person?.position || '',
        source: 'committee',
        status: 'invited',
      };
    })
    .filter(Boolean);

  // Stale = auto-added from a committee the meeting no longer belongs to.
  // Only pruned while the meeting is upcoming; past attendance is immutable.
  const memberUserIds = new Set(committeeMembers.map(cm => cm.user_id));
  const toDelete = isUpcoming(meeting)
    ? participants.filter(p => p.source === 'committee' && !memberUserIds.has(p.user_id))
    : [];

  if (!toCreate.length && !toDelete.length) return { participants, failedCount: 0 };

  // allSettled so one failed write never aborts the rest of the batch.
  const results = await Promise.allSettled([
    ...toCreate.map(d => base44.entities.MeetingParticipant.create(d)),
    ...toDelete.map(p => base44.entities.MeetingParticipant.delete(p.id)),
  ]);
  const rejected = results.filter(r => r.status === 'rejected');
  if (rejected.length) {
    console.warn(`syncMeetingParticipants: ${rejected.length} participant write(s) failed`);
    rejected.forEach(r => console.warn(r.reason));
  }

  // Always re-read so callers get the true current list, partial or complete.
  const refreshed = await base44.entities.MeetingParticipant.filter({ meeting_id: meeting.id });
  return { participants: refreshed, failedCount: rejected.length };
}

/** Manually add a BoardPerson as a participant. */
export async function addParticipant(meeting, person) {
  return base44.entities.MeetingParticipant.create({
    meeting_id: meeting.id,
    committee_id: meeting.committee_id,
    board_person_id: person.id,
    user_id: person.user_id,
    member_name: person.member_name,
    member_email: person.member_email,
    position: person.position || '',
    source: 'manual',
    status: 'invited',
  });
}

export async function updateParticipantStatus(participantId, status) {
  return base44.entities.MeetingParticipant.update(participantId, { status });
}

export async function removeParticipant(participantId) {
  return base44.entities.MeetingParticipant.delete(participantId);
}

/**
 * Build attendance stats per board person from a list of participant records.
 * Returns a map keyed by board_person_id with invited/present/apology/absent
 * counts plus the computed attendance rate.
 */
export function computeAttendanceStats(participants) {
  const map = {};
  participants.forEach(p => {
    const s = map[p.board_person_id] || { invited: 0, present: 0, apology: 0, absent: 0, total: 0 };
    s[p.status] = (s[p.status] || 0) + 1;
    s.total += 1;
    map[p.board_person_id] = s;
  });
  Object.values(map).forEach(s => {
    // Attended = present. Denominator excludes nothing — total meetings invited to.
    s.rate = s.total ? Math.round((s.present / s.total) * 100) : 0;
  });
  return map;
}