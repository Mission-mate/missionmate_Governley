/**
 * Shared column width map for the Conflict of Interest register.
 * Used by both the on-screen table and the PDF export so they stay aligned.
 * 'details' is the built-in first column (member name + ID + disclosure date).
 */
export const COI_COLUMN_WIDTHS = {
  details: 30,
  declarant: 18,
  conflict: 28,
  status: 11,
  conflict_type: 10,
  risk_exposure: 11,
  committee_notified: 12,
  review_frequency: 12,
  last_review_date: 12,
  next_review_date: 12
};

/**
 * Returns a map of column id -> percentage width, normalised to total 100.
 * Ids without a configured width share whatever percentage remains evenly.
 */
export function conflictColumnPercents(ids) {
  const known = ids.filter((id) => COI_COLUMN_WIDTHS[id] != null);
  const unknown = ids.filter((id) => COI_COLUMN_WIDTHS[id] == null);
  const knownTotal = known.reduce((s, id) => s + COI_COLUMN_WIDTHS[id], 0);
  const remaining = Math.max(0, 100 - knownTotal);
  const each = unknown.length ? remaining / unknown.length : 0;

  const raw = {};
  ids.forEach((id) => { raw[id] = COI_COLUMN_WIDTHS[id] != null ? COI_COLUMN_WIDTHS[id] : each; });

  const total = Object.values(raw).reduce((s, v) => s + v, 0) || 1;
  const out = {};
  ids.forEach((id) => { out[id] = raw[id] / total * 100; });
  return out;
}