// Cell descriptor builders shared by the register PDF / Excel exporters.
// A cell is an array of lines; each line is an array of "chips" that mirror what
// the register table renders (plain text, coloured badges, owner initials, progress bars).

export const text = (value, opts = {}) => ({ kind: 'text', text: value == null ? '' : String(value), ...opts });

export const badge = (label, classes) => ({ kind: 'badge', text: label == null ? '' : String(label), classes });

export const person = (name) => ({ kind: 'person', text: name || '' });

export const progress = (value) => ({ kind: 'progress', value: Number(value) || 0 });

/** Small grey caption used for the compact sub-rows, e.g. "Risk Owner:". */
export const caption = (label) => ({ kind: 'text', text: label, muted: true, size: 6.5 });

export const DASH = text('—', { muted: true });

/** Convenience: a single-line cell, or a dash when the value is empty. */
export const line = (chips) => (chips.length ? [chips] : []);

/** Rich-text field → plain text for exports. */
export function stripHtml(html) {
  if (!html) return '';
  return String(html)
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6])>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Initials for the owner avatar, e.g. "Jane Doe" → "JD". */
export function initials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

/** Flatten a cell descriptor to plain text (Excel / measuring). */
export function cellText(cell = []) {
  return cell
    .map((ln) =>
      ln
        .map((c) => (c.kind === 'progress' ? `${c.value}%` : c.text))
        .filter(Boolean)
        .join(' ')
    )
    .filter(Boolean)
    .join('\n');
}

/** First coloured chip in a cell — drives the Excel font colour. */
export function cellColorClasses(cell = []) {
  for (const ln of cell) {
    for (const c of ln) {
      if (c.classes) return c.classes;
      if (c.colorClasses) return c.colorClasses;
    }
  }
  return null;
}