/**
 * Shared cascade used when a ConflictOfInterest record is removed, so the
 * conflict's dependent records never survive it as orphans.
 *
 * Cascade order (each stage completes before the next):
 *   1. ConflictAction { conflict_id }                              — management actions
 *   2. NotePage { object_type: 'conflict_action' | 'conflict_of_interest', object_id } — action page + notes tab
 *   3. Document { object_type: 'conflict_of_interest', object_id } — documents tab
 *   4. The ConflictOfInterest record itself
 *
 * Unlike the meeting cascade, attached documents never block: the caller warns
 * the user up-front how many children will go, so nothing is removed silently.
 * Each stage is a single deleteMany, which makes the whole cascade retry-safe —
 * re-running it simply matches nothing for rows already gone.
 */
export const CONFLICT_OBJECT_TYPE = 'conflict_of_interest';

export type ConflictCascadeResult =
  | {
      ok: true;
      deleted_actions: number;
      deleted_notes: number;
      deleted_documents: number;
    }
  | { ok: false; reason: 'not_found' };

export async function cascadeDeleteConflict(
  svc: any,
  conflictId: string
): Promise<ConflictCascadeResult> {
  const conflict = await svc.ConflictOfInterest.get(conflictId).catch(() => null);
  if (!conflict) return { ok: false, reason: 'not_found' };

  const childQuery = { object_type: CONFLICT_OBJECT_TYPE, object_id: conflictId };

  const actions = await svc.ConflictAction.filter({ conflict_id: conflictId });
  if (actions.length > 0) {
    await svc.ConflictAction.deleteMany({ conflict_id: conflictId });
  }

  // The conflict's single Action page (merged from legacy actions).
  const actionPageQuery = { object_type: 'conflict_action', object_id: conflictId };
  const actionPages = await svc.NotePage.filter(actionPageQuery);
  if (actionPages.length > 0) {
    await svc.NotePage.deleteMany(actionPageQuery);
  }

  const notes = await svc.NotePage.filter(childQuery);
  if (notes.length > 0) {
    await svc.NotePage.deleteMany(childQuery);
  }

  const documents = await svc.Document.filter(childQuery);
  if (documents.length > 0) {
    await svc.Document.deleteMany(childQuery);
  }

  await svc.ConflictOfInterest.delete(conflictId);

  return {
    ok: true,
    deleted_actions: actions.length,
    deleted_notes: notes.length,
    deleted_documents: documents.length,
  };
}