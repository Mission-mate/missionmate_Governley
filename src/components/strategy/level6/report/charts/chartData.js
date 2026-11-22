/** Shared data prep for the Level 6 Data Visualisation charts. */

const num = (v) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));

/** Flatten report tree nodes into a simple chart series. */
export function buildChartSeries(nodes) {
  return (nodes || []).map((n) => {
    const d = n.display || {};
    const expected = num(d.expected);
    const actual = num(d.actual);
    return {
      name: n.label || '—',
      expected,
      actual,
      variance: expected != null && actual != null ? Math.round((actual - expected) * 100) / 100 : null,
      ytd: num(d._ytd),
      expectedYtd: num(d._expected_ytd),
      totalExpected: num(d.total_expected),
      progress: num(d._progress_pct),
    };
  });
}

/** Share-of-total composition data based on recorded actuals. */
export function buildComposition(series) {
  const rows = series.filter((s) => s.actual != null && s.actual > 0);
  const total = rows.reduce((sum, s) => sum + s.actual, 0);
  if (!total) return [];
  return rows.map((s) => ({
    name: s.name,
    value: s.actual,
    share: Math.round((s.actual / total) * 1000) / 10,
  }));
}

export const CHART_COLORS = [
  '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444',
  '#14b8a6', '#ec4899', '#6366f1', '#84cc16', '#f97316',
];

export const EXPECTED_COLOR = '#94a3b8';
export const ACTUAL_COLOR = '#10b981';
export const POSITIVE_COLOR = '#10b981';
export const NEGATIVE_COLOR = '#ef4444';

export const fmtNum = (v) => (v == null ? '—' : Number(v).toLocaleString());