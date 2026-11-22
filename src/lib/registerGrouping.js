import { parseISO } from 'date-fns';

/** Australian financial year label for a date (1 July – 30 June), e.g. "FY 2026-27". */
export function fyLabel(dateStr) {
  if (!dateStr) return '';
  try {
    const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (isNaN(d.getTime())) return '';
    const startYear = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
    return `FY ${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

/** Unique, sorted list of non-empty values produced by getter over records. */
export function uniqueValues(records, getter) {
  return [...new Set(records.map(getter).filter(Boolean))].sort();
}

/** Groups records into [{ key, items }] preserving record order, blanks last. */
export function groupRecords(records, getter) {
  const map = new Map();
  records.forEach((r) => {
    const key = getter(r) || 'Unassigned';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  return [...map.entries()]
    .map(([key, items]) => ({ key, items }))
    .sort((a, b) => {
      if (a.key === 'Unassigned') return 1;
      if (b.key === 'Unassigned') return -1;
      return a.key.localeCompare(b.key);
    });
}