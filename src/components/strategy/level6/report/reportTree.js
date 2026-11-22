import { toNum } from './reportColumns';

/**
 * Build the display tree for the Level 6 reporting table.
 * Data is stored once (period rows + optional location child rows referencing
 * their parent period); the tree only changes how the same rows are grouped.
 *
 * Returns an array of nodes:
 *  { key, type: 'row',    row, display, label }                          — flat editable row
 *  { key, type: 'parent', row?, display, label, childNoun, children: [{ key, row, display, label }] }
 * Parent `display` carries rolled-up totals + computed fields and is read-only.
 */

const NUMERIC_FIELDS = ['expected', 'actual', 'total_expected', 'baseline'];
const round2 = (n) => Math.round(n * 100) / 100;

function sumChildren(children) {
  const totals = {};
  for (const f of NUMERIC_FIELDS) {
    let sum = 0, has = false;
    for (const c of children) {
      const v = toNum(c[f]);
      if (v != null) { sum += v; has = true; }
    }
    totals[f] = has ? round2(sum) : null;
  }
  return totals;
}

/** Attach local (non-cumulative) computed fields: variance + variance %. */
function attachLocal(d) {
  const expected = toNum(d.expected);
  const actual = toNum(d.actual);
  d._variance = expected != null && actual != null ? round2(actual - expected) : null;
  d._variance_pct = d._variance != null && expected ? round2((d._variance / expected) * 100) : null;
  d._ytd = null;
  d._expected_ytd = null;
  d._progress_pct = null;
  return d;
}

/** Walk a sequence of display rows in period order, attaching cumulative fields. */
function runCumulative(displays) {
  let ytd = 0, hasYtd = false;
  let eytd = 0, hasEytd = false;
  for (const d of displays) {
    const expected = toNum(d.expected);
    const actual = toNum(d.actual);
    if (actual != null) { ytd += actual; hasYtd = true; }
    if (expected != null) { eytd += expected; hasEytd = true; }
    d._ytd = hasYtd ? round2(ytd) : null;
    d._expected_ytd = hasEytd ? round2(eytd) : null;
    const totalExpected = toNum(d.total_expected);
    d._progress_pct = hasYtd && totalExpected ? round2((ytd / totalExpected) * 100) : null;
  }
}

export function buildReportTree(rows, settings) {
  const enabled = !!settings?.enabled;
  const breakdown = settings?.breakdown === 'location' ? 'location' : 'period';
  const locations = Array.isArray(settings?.locations) ? settings.locations : [];
  const locName = (id) => locations.find((l) => l.id === id)?.name || 'Unknown category';
  // Managed category order from Reporting Settings (drag and drop). Unknown ids sort last.
  const locRank = (id) => {
    const i = locations.findIndex((l) => l.id === id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };

  // Manual ordering — order_index is the source of truth (drag and drop),
  // with the legacy period anchor date as a tie-breaker.
  const byPeriod = (a, b) => {
    const oa = a?.order_index ?? 0, ob = b?.order_index ?? 0;
    if (oa !== ob) return oa - ob;
    const da = a?.period_date || '', db = b?.period_date || '';
    return da < db ? -1 : da > db ? 1 : 0;
  };
  const sorted = [...rows].sort(byPeriod);
  const parents = sorted.filter((r) => !r.parent_id);
  const childRows = sorted.filter((r) => r.parent_id);
  const childrenByParent = {};
  for (const c of childRows) (childrenByParent[c.parent_id] ||= []).push(c);
  const parentById = {};
  for (const p of parents) parentById[p.id] = p;

  if (!enabled || breakdown === 'period') {
    // Period layout (also legacy flat mode). Parents = reporting periods.
    const nodes = parents.map((p) => {
      const kids = enabled ? (childrenByParent[p.id] || []) : [];
      if (kids.length === 0) {
        return { key: p.id, type: 'row', row: p, label: p.period_label, display: attachLocal({ ...p }) };
      }
      const display = attachLocal({ ...p, ...sumChildren(kids) });
      return {
        key: p.id,
        type: 'parent',
        row: p,
        label: p.period_label,
        childNoun: 'categories',
        display,
        children: kids
          .slice()
          .sort((a, b) => locRank(a.location_id) - locRank(b.location_id))
          .map((c) => ({ key: c.id, row: c, label: locName(c.location_id), display: attachLocal({ ...c }) })),
      };
    });
    // Cumulative columns run across the period sequence using effective (rolled-up) values.
    runCumulative(nodes.map((n) => n.display));
    return nodes;
  }

  // Location layout. Parents = locations (virtual, computed); children = the same stored rows.
  const byLocation = new Map();
  for (const c of childRows) {
    if (!byLocation.has(c.location_id)) byLocation.set(c.location_id, []);
    byLocation.get(c.location_id).push(c);
  }
  const orderedLocIds = [
    ...locations.map((l) => l.id).filter((id) => byLocation.has(id)),
    ...[...byLocation.keys()].filter((id) => !locations.some((l) => l.id === id)),
  ];

  const nodes = orderedLocIds.map((locId) => {
    const kids = byLocation.get(locId)
      .slice()
      .sort((a, b) => byPeriod(parentById[a.parent_id], parentById[b.parent_id]));
    const children = kids.map((c) => ({
      key: c.id,
      row: c,
      label: parentById[c.parent_id]?.period_label || '—',
      display: attachLocal({ ...c }),
    }));
    runCumulative(children.map((c) => c.display)); // YTD per location across its periods
    const display = attachLocal({ id: `loc_${locId}`, ...sumChildren(kids) });
    display._ytd = display.actual;
    display._expected_ytd = display.expected;
    const te = toNum(display.total_expected);
    display._progress_pct = display.actual != null && te ? round2((display.actual / te) * 100) : null;
    return { key: `loc_${locId}`, type: 'parent', locationId: locId, label: locName(locId), childNoun: 'periods', display, children };
  });

  // Reporting periods with no location children remain as flat editable rows.
  const standalone = parents
    .filter((p) => !(childrenByParent[p.id] || []).length)
    .map((p) => ({ key: p.id, type: 'row', row: p, label: p.period_label, display: attachLocal({ ...p }) }));
  runCumulative(standalone.map((n) => n.display));

  return [...nodes, ...standalone];
}