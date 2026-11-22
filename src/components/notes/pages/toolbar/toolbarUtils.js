import { SLASH_BLOCKS } from '@/components/notes/pages/noteBlocks';

/** Block types offered in the toolbar's "Text" dropdown (slash menu minus Divider). */
export const TEXT_BLOCKS = SLASH_BLOCKS.filter((b) => !b.divider);

/** Map a Quill line format to the matching TEXT_BLOCKS id. */
export const blockIdOf = (fmt = {}) => {
  if (fmt.header === 1) return 'h1';
  if (fmt.header === 2) return 'h2';
  if (fmt.list === 'bullet') return 'bullet';
  if (fmt.list === 'ordered') return 'ordered';
  if (fmt.list === 'checked' || fmt.list === 'unchecked') return 'check';
  return 'text';
};

/** Minimal URL normalising — prepend https:// when no known scheme is present. */
export const normalizeUrl = (raw) => {
  const u = String(raw || '').trim();
  if (!u) return '';
  return /^(https?:|mailto:|tel:)/i.test(u) ? u : `https://${u}`;
};

/** Full extent of the link blot around a caret index, or null when not in a link. */
export const linkRangeAt = (quill, index) => {
  for (const i of [index, index - 1]) {
    if (i < 0) continue;
    let blot = quill.getLeaf(i)[0];
    while (blot && blot !== quill.scroll && blot.statics?.blotName !== 'link') blot = blot.parent;
    if (blot && blot !== quill.scroll) return { index: blot.offset(quill.scroll), length: blot.length() };
  }
  return null;
};