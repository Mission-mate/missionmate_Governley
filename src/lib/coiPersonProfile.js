import { base44 } from '@/api/base44Client';

const linkedConflicts = (registerId, personId) =>
  base44.entities.ConflictOfInterest.filter({ register_id: registerId, member_user_id: personId });

/** Number of declarations linked to a person in this register. */
export const countCoiPersonDeclarations = (registerId, personId) =>
  base44.entities.ConflictOfInterest.count({ register_id: registerId, member_user_id: personId });

/** Update a person profile and sync the name snapshot on every linked declaration. */
export async function updateCoiPerson(registerId, personId, data) {
  await base44.entities.CoiPerson.update(personId, data);
  const rows = await linkedConflicts(registerId, personId);
  if (rows.length) {
    await base44.entities.ConflictOfInterest.bulkUpdate(rows.map((r) => ({ id: r.id, member_name: data.full_name })));
  }
}

/**
 * Delete a person profile through the server cascade. keepDeclarations: linked
 * declarations stay with the person cleared; otherwise they are permanently
 * deleted with their children (admin only). Throws with a readable message.
 */
export async function deleteCoiPerson(registerId, personId, keepDeclarations) {
  try {
    const { data } = await base44.functions.invoke('deleteCoiPerson', {
      register_id: registerId, person_id: personId, keep_declarations: keepDeclarations,
    });
    if (!data?.ok) throw new Error(data?.message || 'The person could not be deleted.');
    return data;
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || 'The person could not be deleted.';
    throw new Error(message);
  }
}