/** Search / filter / group logic for the Program Deliverables register. */
export const HEALTH_TABS = [
  { value: '', label: 'All' },
  { value: 'On Track', label: 'On Track' },
  { value: 'At Risk', label: 'At Risk' },
  { value: 'Off Track', label: 'Off Track' },
];

export function deliverableFields(config) {
  return [
    { key: 'health', label: 'Health' },
    { key: 'status', label: 'Status' },
    ...(config.show_priority ? [{ key: 'priority', label: 'Priority' }] : []),
    { key: 'owner', label: 'Owner' },
    ...config.custom_columns
      .filter((c) => c.type !== 'Long Text')
      .map((c) => ({ key: `cf:${c.id}`, label: c.title, custom: true })),
  ];
}

export const fieldValue = (d, key) => (key.startsWith('cf:') ? d.custom_fields?.[key.slice(3)] : d[key]);
const filled = (v) => v !== undefined && v !== null && v !== '';

export const distinctValues = (rows, field) =>
  [...new Set(rows.map((r) => fieldValue(r, field.key)).filter(filled).map(String))].sort();

export function applyView(rows, { search, health, filters }) {
  const q = search.trim().toLowerCase();
  return rows.filter((d) =>
    (!health || d.health === health) &&
    (!q || d.title?.toLowerCase().includes(q)) &&
    Object.entries(filters).every(([k, v]) => !v || String(fieldValue(d, k) ?? '') === v));
}

export function groupRows(rows, groupBy) {
  if (!groupBy) return [{ key: '', label: '', rows }];
  const map = new Map();
  rows.forEach((r) => {
    const v = fieldValue(r, groupBy);
    const label = filled(v) ? String(v) : 'None';
    if (!map.has(label)) map.set(label, []);
    map.get(label).push(r);
  });
  return [...map.entries()].map(([label, list]) => ({ key: label, label, rows: list }));
}

export const healthCounts = (rows) => Object.fromEntries(
  HEALTH_TABS.map((t) => [t.value, t.value ? rows.filter((r) => r.health === t.value).length : rows.length]));