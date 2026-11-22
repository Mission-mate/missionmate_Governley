/**
 * Ordering helpers for the Level 6 reporting table.
 * Reporting periods are named manually by the user and ordered manually via
 * drag and drop — `order_index` is the single source of truth for row order.
 */

/** Next order index for a new period row — appends to the end of the table. */
export function nextOrderIndex(rows) {
  const tops = (rows || []).filter((r) => !r.parent_id);
  if (tops.length === 0) return 0;
  return Math.max(...tops.map((r) => r.order_index ?? 0)) + 1;
}