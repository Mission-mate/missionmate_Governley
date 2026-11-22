import { base44 } from '@/api/base44Client';
import { calcNextReviewDate } from '@/lib/reviewDateUtils';
import { deleteAllWhere, settleAll } from '@/lib/cascadeDelete';
import { localToday } from '@/lib/localClock';

export const PERSON_TYPES = [
  { value: 'board_member', label: 'Board Member' },
  { value: 'non_board_member', label: 'Non-Board Member' },
];

export const APPOINTMENT_TERMS = ['Ongoing', 'Custom'];
export const TERM_UNITS = ['Months', 'Years'];

/**
 * Compute the term renewal/expiry date from the appointment date + term config.
 * Ongoing (or missing date) returns null.
 */
export function calcTermRenewalDate({ appointment_term, appointment_date, interval_value, interval_unit }) {
  if (appointment_term !== 'Custom' || !appointment_date) return null;
  return calcNextReviewDate('Every', {
    baseDate: appointment_date,
    intervalValue: interval_value,
    intervalUnit: interval_unit,
  });
}

/** Create a BoardPerson from an application user. */
export async function addPerson({
  user,
  type = 'board_member',
  position = '',
  contact_number = '',
  appointment_start_date = null,
  director_id = '',
  appointment_date = '',
  appointment_term = 'Ongoing',
  interval_value = null,
  interval_unit = 'Years',
  term_renewal_date = null,
  status = 'active',
}) {
  const isCustom = appointment_term === 'Custom';
  return base44.entities.BoardPerson.create({
    user_id: user.id,
    type,
    member_name: user.full_name || user.email,
    member_email: user.email,
    position: position || 'Member',
    contact_number,
    appointment_start_date: appointment_start_date || null,
    director_id,
    appointment_date: appointment_date || localToday(),
    appointment_term: appointment_term || 'Ongoing',
    interval_value: isCustom ? Number(interval_value) || null : null,
    interval_unit: isCustom ? interval_unit || 'Years' : null,
    term_renewal_date: isCustom ? term_renewal_date || null : null,
    status: status || 'active',
  });
}

/**
 * Update a BoardPerson record. When the cached identity (name/email/position) changes,
 * ripple it to all related MeetingParticipant & CommitteeMember records so no
 * stale cached values are left behind.
 */
export async function updatePerson(id, data) {
  const updated = await base44.entities.BoardPerson.update(id, data);
  if (data.member_name !== undefined || data.member_email !== undefined || data.position !== undefined) {
    // Fire-and-forget; the entity automation also covers this server-side.
    base44.functions.invoke('syncParticipantIdentity', { board_person_id: id }).catch(() => {});
  }
  return updated;
}

/**
 * Remove a BoardPerson and every child record that points at them: committee
 * memberships, meeting participation, skill assignments and attribute
 * assignments — so no register, matrix or chart keeps counting a removed person.
 *
 * Best-effort and parallel: every child cleanup is a guarded bulk delete and they
 * all run to completion via settleAll, so one failing group never abandons the
 * rest. The parent record is then deleted regardless, because leaving the person
 * behind after their children are gone is the worse outcome — and the caller
 * receives the list of groups that failed so it can say exactly what was left
 * over. Not transactional (the platform has no database transactions), but every
 * step is retry-safe: re-running matches nothing for rows already removed, and
 * the reconcileBoardMatrixOrphans function sweeps up any remainder.
 *
 * @returns {{ failed: {entity: string, reason: any}[] }}
 */
export async function removePerson(personId) {
  const person = await base44.entities.BoardPerson.get(personId);

  // Committee memberships and meeting participation are matched by record link
  // AND by user id, so legacy rows saved without board_person_id are detached too.
  const jobs = [
    { id: 'committee memberships', promise: deleteAllWhere('CommitteeMember', { board_person_id: personId }) },
    { id: 'meeting participation', promise: deleteAllWhere('MeetingParticipant', { board_person_id: personId }) },
    { id: 'skill assignments', promise: deleteAllWhere('MemberSkill', { person_id: personId }) },
    { id: 'attribute assignments', promise: deleteAllWhere('MemberAttribute', { person_id: personId }) },
  ];
  if (person?.user_id) {
    jobs.push(
      { id: 'committee memberships', promise: deleteAllWhere('CommitteeMember', { user_id: person.user_id }) },
      { id: 'meeting participation', promise: deleteAllWhere('MeetingParticipant', { user_id: person.user_id }) },
    );
  }

  const { failed } = await settleAll(jobs);
  await base44.entities.BoardPerson.delete(personId);

  // De-duplicate, since a group can be attempted by two different keys.
  const groups = [...new Set(failed.map((f) => f.id))];
  return { failed: groups.map((entity) => ({ entity, reason: failed.find((f) => f.id === entity)?.reason })) };
}