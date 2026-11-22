/**
 * Shared cascade for Compliance Calendar obligations.
 *
 * Ownership map:
 *   ComplianceRegister (calendar) ─ ComplianceObligation { register_id }
 *   ComplianceObligation ─ ObligationTask { parent_type: compliance_obligation, parent_id }
 *                        ─ NotePage / Document / DocumentFolder { object_type: compliance_obligation, object_id }
 *
 * Children go before parents and every removal is verified by a re-count, so an
 * obligation (or calendar) is deleted only once everything it owns is gone. A failed
 * run leaves the parent in place, and each step is idempotent, so it can simply be repeated.
 */
import { CascadeError, withRetry, purge, purgeAttached, drain, deleteParent, add, type Tally } from './cascadeKit.ts';

const OBJECT_TYPE = 'compliance_obligation';

/** Remove the given obligations (at most one id chunk) with their checklist, notes, documents and folders. */
export async function cascadeDeleteObligations(svc: any, ids: string[], tally: Tally = {}): Promise<Tally> {
  add(tally, 'ObligationTask', await purge(svc, 'ObligationTask', { parent_type: OBJECT_TYPE, parent_id: { $in: ids } }));
  await purgeAttached(svc, tally, OBJECT_TYPE, ids);
  add(tally, 'ComplianceObligation', await purge(svc, 'ComplianceObligation', { id: { $in: ids } }));
  return tally;
}

/** Remove a compliance calendar with every obligation it owns; the calendar itself goes last. */
export async function cascadeDeleteCalendar(svc: any, calendarId: string, tally: Tally = {}): Promise<Tally> {
  await drain(svc, 'ComplianceObligation', { register_id: calendarId }, async (ids) => {
    await cascadeDeleteObligations(svc, ids, tally);
  });
  await deleteParent(svc, 'ComplianceRegister', calendarId);
  const left = await withRetry('ComplianceRegister', () => svc.ComplianceRegister.count({ id: calendarId }));
  if (left > 0) throw new CascadeError('ComplianceRegister', new Error('the calendar is still present'));
  add(tally, 'ComplianceRegister', 1);
  return tally;
}