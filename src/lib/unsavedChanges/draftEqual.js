/**
 * Structural draft comparison for the unsaved-changes guard.
 * - key order never matters
 * - null, undefined and '' are equal ("empty")
 * - strings are trimmed
 * - Dates compare by value
 */
const isEmpty = (v) => v === null || v === undefined || (typeof v === 'string' && v.trim() === '');

export function draftEqual(a, b) {
  if (isEmpty(a) && isEmpty(b)) return true;
  if (isEmpty(a) || isEmpty(b)) return false;
  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }
  if (typeof a === 'string' && typeof b === 'string') return a.trim() === b.trim();
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => draftEqual(v, b[i]));
  }
  if (typeof a === 'object' && typeof b === 'object') {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of keys) if (!draftEqual(a[k], b[k])) return false;
    return true;
  }
  return a === b;
}