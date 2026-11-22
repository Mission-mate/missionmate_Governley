import { base44 } from '@/api/base44Client';
import { createNotePage } from '@/lib/notePages';

/** NotePage object type holding a conflict's single Action page. */
export const CONFLICT_ACTION_TYPE = 'conflict_action';
export const ACTION_PAGE_TITLE = 'Action';

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Legacy ConflictAction records plus the Action page — for overview, export and counts. */
export async function listConflictActionEntries(conflictId) {
  const [legacy, pages] = await Promise.all([
    base44.entities.ConflictAction.filter({ conflict_id: conflictId }),
    base44.entities.NotePage.filter({ object_type: CONFLICT_ACTION_TYPE, object_id: conflictId }),
  ]);
  return [...legacy, ...pages];
}

/**
 * Load the conflict's Action page. On first open, legacy ConflictAction records
 * are merged (oldest first) into one page; the page is saved before the legacy
 * records are removed, so a failed save leaves them intact. Idempotent: once a
 * page exists it is returned as-is.
 */
export async function loadConflictActionPage(conflictId) {
  const [page] = await base44.entities.NotePage.filter({ object_type: CONFLICT_ACTION_TYPE, object_id: conflictId });
  if (page) return page;

  const legacy = await base44.entities.ConflictAction.filter({ conflict_id: conflictId }, 'created_date');
  if (!legacy.length) return null;

  const content = legacy
    .map((a) => `${a.title ? `<h2>${escapeHtml(a.title)}</h2>` : ''}${a.content || ''}`)
    .join('');
  const merged = await createNotePage(CONFLICT_ACTION_TYPE, conflictId, {
    title: ACTION_PAGE_TITLE,
    content,
    owner_name: legacy[0].created_by_name || '',
  });
  await base44.entities.ConflictAction.deleteMany({ conflict_id: conflictId });
  return merged;
}