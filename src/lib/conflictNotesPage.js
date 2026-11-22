import { base44 } from '@/api/base44Client';
import { listNotePages, updateNotePage } from '@/lib/notePages';
import { CONFLICT_OBJECT_TYPE } from '@/lib/conflictChildCounts';

export const NOTES_PAGE_TITLE = 'Notes';

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Load a conflict's single Notes page. If several pages exist they are merged
 * (in order, each title kept as a heading) into the first; the merged page is
 * saved before the extras are deleted, so a failed save never loses content.
 */
export async function loadConflictNotesPage(conflictId) {
  const pages = await listNotePages(CONFLICT_OBJECT_TYPE, conflictId);
  if (pages.length <= 1) return pages[0] || null;

  const [first, ...rest] = pages;
  const content = pages
    .map((p) => `${p.title ? `<h2>${escapeHtml(p.title)}</h2>` : ''}${p.content || ''}`)
    .join('');
  const merged = await updateNotePage(first.id, { title: NOTES_PAGE_TITLE, content });
  await base44.entities.NotePage.deleteMany({ id: { $in: rest.map((p) => p.id) } });
  return merged;
}