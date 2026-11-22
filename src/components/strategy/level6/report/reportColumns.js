/** Column definitions + computed values for the Level 6 per-row reporting table. */

export const SYSTEM_COLUMNS = [
  { key: 'expected', label: 'Expected', tooltip: 'Budget/Target values', renamable: true, reorderable: true },
  { key: 'actual', label: 'Actual', reorderable: true },
  { key: 'baseline', label: 'Baseline', tooltip: 'The fixed point of reference for benchmarking', reorderable: true, hideable: true },
  { key: 'variance', label: 'Variance' },
];

// Keys of system columns the user can reorder (Variance stays pinned last).
export const REORDERABLE_SYSTEM_KEYS = SYSTEM_COLUMNS.filter((c) => c.reorderable).map((c) => c.key);

/** Ordered list of system column keys for a block, honouring the saved reorder. Variance is always last. */
export function systemColumnOrder(config) {
  const saved = Array.isArray(config?.system_order) ? config.system_order.filter((k) => REORDERABLE_SYSTEM_KEYS.includes(k)) : [];
  const missing = REORDERABLE_SYSTEM_KEYS.filter((k) => !saved.includes(k));
  return [...saved, ...missing, 'variance'];
}

/** Whether a hideable system column (e.g. Baseline) is currently shown. Visible by default. */
export function isSystemVisible(config, key) {
  const def = SYSTEM_COLUMNS.find((c) => c.key === key);
  if (!def?.hideable) return true;
  return !(config?.system_hidden || []).includes(key);
}

/** Ordered system column keys, excluding hidden hideable ones. */
export function visibleSystemColumnOrder(config) {
  return systemColumnOrder(config).filter((k) => isSystemVisible(config, k));
}

/** Effective label for a system column, applying a per-block rename override. */
export function systemLabel(config, key) {
  const def = SYSTEM_COLUMNS.find((c) => c.key === key);
  return config?.system_labels?.[key] || def?.label || key;
}

export const OPTIONAL_COLUMNS = [
  { key: 'ytd', label: 'Actual YTD', tooltip: 'Total actuals reported from the start to the latest period.', computed: true },
  { key: 'total_expected', label: 'Total Target', tooltip: 'The overall target or budget for the full reporting cycle.', computed: false },
  { key: 'expected_ytd', label: 'Expected YTD', tooltip: 'Total expected from the start to the latest period.', computed: true },
  { key: 'progress_pct', label: 'Progress %', tooltip: 'Percentage of the total target achieved, calculated as Actual YTD ÷ Total Target.', computed: true },
  { key: 'variance_pct', label: 'Variance %', tooltip: 'Variance expressed as a percentage', computed: true },
];

export function normalizeReportColumns(rc) {
  const src = rc && typeof rc === 'object' ? rc : {};
  const knownKeys = OPTIONAL_COLUMNS.map((c) => c.key);
  const order = Array.isArray(src.optional_order) ? src.optional_order.filter((k) => knownKeys.includes(k)) : [];
  const missing = knownKeys.filter((k) => !order.includes(k));
  return {
    optional_visible: Array.isArray(src.optional_visible) ? src.optional_visible.filter((k) => knownKeys.includes(k)) : [],
    optional_order: [...order, ...missing],
    optional_labels: src.optional_labels && typeof src.optional_labels === 'object' ? src.optional_labels : {},
    system_labels: src.system_labels && typeof src.system_labels === 'object' ? src.system_labels : {},
    system_order: Array.isArray(src.system_order) ? src.system_order : [],
    system_hidden: Array.isArray(src.system_hidden) ? src.system_hidden : [],
    custom: Array.isArray(src.custom) ? src.custom : [],
  };
}

export function optionalLabel(config, key) {
  const def = OPTIONAL_COLUMNS.find((c) => c.key === key);
  return config.optional_labels?.[key] || def?.label || key;
}

export const toNum = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

const round2 = (n) => Math.round(n * 100) / 100;

/** Sort rows and attach computed values (_variance, _ytd, _expected_ytd, _progress_pct, _variance_pct). */
export function computeReportRows(rows) {
  const sorted = [...rows].sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  let ytd = 0, hasYtd = false;
  let eytd = 0, hasEytd = false;
  return sorted.map((r) => {
    const expected = toNum(r.expected);
    const actual = toNum(r.actual);
    if (actual != null) { ytd += actual; hasYtd = true; }
    if (expected != null) { eytd += expected; hasEytd = true; }
    const variance = expected != null && actual != null ? round2(actual - expected) : null;
    const totalExpected = toNum(r.total_expected);
    return {
      ...r,
      _variance: variance,
      _ytd: hasYtd ? round2(ytd) : null,
      _expected_ytd: hasEytd ? round2(eytd) : null,
      _progress_pct: hasYtd && totalExpected ? round2((ytd / totalExpected) * 100) : null,
      _variance_pct: variance != null && expected ? round2((variance / expected) * 100) : null,
    };
  });
}