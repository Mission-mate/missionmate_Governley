/**
 * Shared cascade for removing a Conflict of Interest declarant (CoiPerson).
 *
 *   keep = true   linked declarations stay, with the person cleared from them
 *   keep = false  linked declarations go too, each with its ConflictAction rows,
 *                 action page, notes, documents and folders
 *
 * The declarant is deleted last, so a failed run leaves it in place and the
 * whole operation can simply be retried (every stage is idempotent).
 */
import { withRetry, purge, purgeAttached, drain, deleteParent, add, type Tally } from './cascadeKit.ts';

export const linkedQuery = (registerId: string, personId: string) => ({ register_id: registerId, member_user_id: personId });

async function detachDeclarations(svc: any, q: Record<string, unknown>, tally: Tally) {
  // The $set changes a field in the query, so each pass shrinks the match until none remain.
  for (let round = 0; round < 20; round++) {
    const res = await withRetry('ConflictOfInterest', () =>
      svc.ConflictOfInterest.updateMany(q, { $set: { member_user_id: '', member_name: '' } }));
    add(tally, 'detached', res?.updated ?? res?.modified_count ?? 0);
    if (!res?.has_more) break;
  }
  const left = await withRetry('ConflictOfInterest', () => svc.ConflictOfInterest.count(q));
  if (left > 0) throw new Error(`${left} declaration(s) are still linked to this person`);
}

async function deleteDeclarations(svc: any, q: Record<string, unknown>, tally: Tally) {
  await drain(svc, 'ConflictOfInterest', q, async (ids) => {
    add(tally, 'ConflictAction', await purge(svc, 'ConflictAction', { conflict_id: { $in: ids } }));
    await purgeAttached(svc, tally, 'conflict_action', ids, ['NotePage']);
    await purgeAttached(svc, tally, 'conflict_of_interest', ids);
    add(tally, 'ConflictOfInterest', await purge(svc, 'ConflictOfInterest', { id: { $in: ids } }));
  });
}

export async function cascadeDeleteCoiPerson(svc: any, registerId: string, personId: string, keep: boolean): Promise<Tally> {
  const tally: Tally = {};
  const q = linkedQuery(registerId, personId);
  if (keep) await detachDeclarations(svc, q, tally);
  else await deleteDeclarations(svc, q, tally);
  await deleteParent(svc, 'CoiPerson', personId);
  return tally;
}