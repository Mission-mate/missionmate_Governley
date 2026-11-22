/**
 * Shared formatting helpers for membership submissions.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Formats a date/date-time as "2 Jul 2026". */
export function formatSubmissionDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Turns a stored answer value into readable display text. */
export function formatAnswerValue(value) {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') {
    if (value.file_name) return String(value.file_name);
    if (value.url) return String(value.url);
    return JSON.stringify(value);
  }
  return String(value);
}