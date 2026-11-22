import { base44 } from '@/api/base44Client';

/** Create a committee. */
export async function createCommittee(data) {
  return base44.entities.Committee.create({ status: 'active', ...data });
}

/**
 * Update a committee.
 *
 * Meetings cache the committee name (Meeting.committee_name) for display,
 * grouping and filtering, so a rename must be cascaded onto them — otherwise
 * old meetings keep the previous name and show up as a separate group / stale
 * filter option. updateMany caps at 500 rows per call, so loop on has_more.
 * The $set field is part of the query match, so rows never re-match.
 */
export async function updateCommittee(id, data) {
  const updated = await base44.entities.Committee.update(id, data);

  if (data.name) {
    let hasMore = true;
    while (hasMore) {
      const res = await base44.entities.Meeting.updateMany(
        { committee_id: id, committee_name: { $ne: data.name } },
        { $set: { committee_name: data.name } }
      );
      hasMore = !!res?.has_more;
    }
  }

  return updated;
}

/** Archive (retire) a committee — keeps the record and its membership roster. */
export async function archiveCommittee(id) {
  return base44.entities.Committee.update(id, { status: 'archived' });
}

/** Restore an archived committee back to active. */
export async function restoreCommittee(id) {
  return base44.entities.Committee.update(id, { status: 'active' });
}

/**
 * Count the records that block a permanent delete.
 * Members must be removed first; meetings must be reassigned first.
 */
export async function getCommitteeDeleteBlockers(id) {
  const [members, meetings] = await Promise.all([
    base44.entities.CommitteeMember.filter({ committee_id: id }),
    base44.entities.Meeting.filter({ committee_id: id })
  ]);
  return { memberCount: members.length, meetingCount: meetings.length };
}

/** Move every meeting linked to `fromId` onto another committee. */
export async function reassignCommitteeMeetings(fromId, to) {
  const meetings = await base44.entities.Meeting.filter({ committee_id: fromId });
  await Promise.all(
    meetings.map((m) =>
      base44.entities.Meeting.update(m.id, { committee_id: to.id, committee_name: to.name })
    )
  );
  return meetings.length;
}

/**
 * Permanently delete a committee. Only allowed once it has no members and no
 * linked meetings — the caller shows the blocked state instead.
 */
export async function deleteCommittee(id) {
  const { memberCount, meetingCount } = await getCommitteeDeleteBlockers(id);
  if (memberCount > 0 || meetingCount > 0) {
    throw new Error('This committee still has linked records and cannot be deleted.');
  }
  await base44.entities.Committee.delete(id);
}

/**
 * Collapse a person's membership rows for one committee down to a single row.
 * The oldest row wins (deterministic across concurrent callers, so two racing
 * calls converge on the same keeper) and the rest are removed.
 */
async function collapseMemberships(rows) {
  const sorted = [...rows].sort((a, b) =>
    String(a.created_date || '').localeCompare(String(b.created_date || '')) ||
    String(a.id).localeCompare(String(b.id))
  );
  const [keep, ...dupes] = sorted;
  if (dupes.length > 0) {
    await Promise.all(dupes.map(d => base44.entities.CommitteeMember.delete(d.id).catch(() => {})));
  }
  return keep;
}

/**
 * Add a BoardPerson to a committee (cached identity fields).
 * Enforces one-membership-per-committee: if the person is already a member,
 * the existing record is returned instead of creating a duplicate.
 *
 * There is no server-side uniqueness constraint, so a filter-then-create can
 * race with a concurrent call. After creating we re-read the set and collapse
 * it to one row, which converges even when both calls passed the initial check.
 */
export async function addCommitteeMember(committeeId, person) {
  const query = { committee_id: committeeId, user_id: person.user_id };

  const existing = await base44.entities.CommitteeMember.filter(query);
  if (existing.length > 0) return collapseMemberships(existing);

  const created = await base44.entities.CommitteeMember.create({
    committee_id: committeeId,
    board_person_id: person.id,
    user_id: person.user_id,
    member_name: person.member_name,
    member_email: person.member_email,
  });

  // Re-check: a concurrent call may have created its own row in the meantime.
  const after = await base44.entities.CommitteeMember.filter(query);
  if (after.length > 1) return collapseMemberships(after);
  return created;
}

/** Remove a committee member. */
export async function removeCommitteeMember(memberId) {
  return base44.entities.CommitteeMember.delete(memberId);
}