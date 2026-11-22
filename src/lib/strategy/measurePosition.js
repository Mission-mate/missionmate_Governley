/** Display config for a measure's point-in-time current position. */

export const POSITION_LABEL = {
  meeting: 'Meeting target',
  near: 'Near target',
  below: 'Below target',
  no_data: 'No data',
};

export const POSITION_PILL = {
  meeting: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  near: 'bg-amber-50 text-amber-700 border-amber-200',
  below: 'bg-red-50 text-red-700 border-red-200',
  no_data: 'bg-secondary text-muted-foreground border-border',
};

/** PDF text colours (RGB) for each position. */
export const POSITION_RGB = {
  meeting: [22, 163, 74],
  near: [217, 119, 6],
  below: [220, 38, 38],
  no_data: [100, 116, 139],
};

/** Format a measure value with its unit ($ prefix, % / # suffix). */
export function formatMeasureValue(value, unit) {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  const text = Number.isFinite(n) ? n.toLocaleString() : String(value);
  if (unit === '$') return `$${text}`;
  if (unit === '%') return `${text}%`;
  return text;
}

/** Signed gap display — a negative gap means the measure is above its target. */
export function formatGap(gap, unit) {
  if (gap === null || gap === undefined) return '—';
  const n = Number(gap);
  if (!Number.isFinite(n)) return '—';
  if (n === 0) return 'On target';
  // Positive gap = short of target; negative = above target.
  return `${n > 0 ? '−' : '+'}${formatMeasureValue(Math.abs(n), unit)}`;
}