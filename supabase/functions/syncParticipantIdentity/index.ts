import { createClientFromRequest, serve } from '../_shared/base44.ts';

/**
 * Ripples a BoardPerson identity change (name / email / position) to all
 * related CommitteeMember and MeetingParticipant cached records.
 *
 * Invoked by an entity automation on BoardPerson updates, and can also be
 * called manually with { board_person_id } to heal a single person, or
 * { heal_all: true } to re-sync every BoardPerson (one-time migration).
 */
serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const isAuthed = await base44.auth.isAuthenticated();
    if (!isAuthed) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    // Automation payload shape: { event, data, old_data }
    const eventEntityId = body?.event?.entity_id;
    const personId = body?.board_person_id || body?.data?.id || eventEntityId;
    const healAll = body?.heal_all === true;

    const db = base44.asServiceRole.entities;

    const people = healAll
      ? await db.BoardPerson.list()
      : personId
        ? [await db.BoardPerson.get(personId)].filter(Boolean)
        : [];

    if (!people.length) {
      return Response.json({ updated: 0, message: 'No matching BoardPerson found.' });
    }

    let updatedCount = 0;

    for (const person of people) {
      // CommitteeMember has no position field — participants get the wider payload.
      const fields = {
        member_name: person.member_name,
        member_email: person.member_email,
      };
      const participantFields = { ...fields, position: person.position };

      const [participants, committeeMembers] = await Promise.all([
        db.MeetingParticipant.filter({ board_person_id: person.id }),
        db.CommitteeMember.filter({ board_person_id: person.id }),
      ]);

      const ops = [];
      for (const p of participants) {
        if (
          p.member_name !== participantFields.member_name ||
          p.member_email !== participantFields.member_email ||
          p.position !== participantFields.position
        ) {
          ops.push(db.MeetingParticipant.update(p.id, participantFields));
        }
      }
      for (const cm of committeeMembers) {
        if (cm.member_name !== fields.member_name || cm.member_email !== fields.member_email) {
          ops.push(db.CommitteeMember.update(cm.id, fields));
        }
      }

      await Promise.all(ops);
      updatedCount += ops.length;
    }

    return Response.json({ updated: updatedCount, people: people.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});