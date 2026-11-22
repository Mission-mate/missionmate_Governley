import { base44 } from '@/api/base44Client';
import { listConflictActionEntries } from '@/lib/conflictActionPage';
import { listNotePages } from '@/lib/notePages';

/** Link key used for conflict notes and documents (see the conflict drawer tabs). */
export const CONFLICT_OBJECT_TYPE = 'conflict_of_interest';

/**
 * Count the records a conflict delete will take with it, so the confirmation
 * dialog can warn the user instead of removing children silently.
 *
 * Read-only, so it runs client-side — no second backend function needed.
 */
export async function countConflictChildren(conflictIds) {
  const ids = conflictIds || [];
  const per = await Promise.all(
    ids.map(async (id) => {
      const [actions, notes, documents] = await Promise.all([
        listConflictActionEntries(id),
        listNotePages(CONFLICT_OBJECT_TYPE, id),
        base44.entities.Document.filter({ object_type: CONFLICT_OBJECT_TYPE, object_id: id }),
      ]);
      return { actions: actions.length, notes: notes.length, documents: documents.length };
    })
  );
  return per.reduce(
    (acc, c) => ({
      actions: acc.actions + c.actions,
      notes: acc.notes + c.notes,
      documents: acc.documents + c.documents,
    }),
    { actions: 0, notes: 0, documents: 0 }
  );
}

/** "3 actions, 2 notes and 1 document" — empty string when there are no children. */
export function describeConflictChildren(counts) {
  if (!counts) return '';
  const parts = [
    [counts.actions, 'action'],
    [counts.notes, 'note'],
    [counts.documents, 'document'],
  ]
    .filter(([n]) => n > 0)
    .map(([n, noun]) => `${n} ${noun}${n === 1 ? '' : 's'}`);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`;
}