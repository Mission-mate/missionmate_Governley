import { parseISO, isBefore, startOfDay, format } from 'date-fns';

export const STATUS_COLORS = {
  'Not Started': '#94a3b8',
  'In Progress': '#3b82f6',
  Completed: '#10b981',
  'On Hold': '#f59e0b',
  Cancelled: '#ef4444',
};

export const HEALTH_COLORS = {
  'On Track': '#10b981',
  'At Risk': '#f59e0b',
  'Off Track': '#ef4444',
  'Not Set': '#cbd5e1',
};

const day = (v) => { try { return v ? startOfDay(parseISO(v)) : null; } catch { return null; } };

const monthKeyOf = (t) => { const d = day(t.due_date); return d ? format(d, 'yyyy-MM') : null; };
const quarterKeyOf = (t) => {
  const d = day(t.due_date);
  return d ? `${d.getFullYear()}-Q${Math.floor(d.getMonth() / 3) + 1}` : null;
};
const yearKeyOf = (t) => { const d = day(t.due_date); return d ? String(d.getFullYear()) : null; };

export const isOverdue = (t) => {
  const d = day(t.due_date);
  const status = t.status || '';
  return !!d && status !== 'Completed' && status !== 'Cancelled' && isBefore(d, startOfDay(new Date()));
};

const QUARTER_LABELS = ['Jan–Mar', 'Apr–Jun', 'Jul–Sep', 'Oct–Dec'];

/** Bucket key for a task under the chosen period. */
export const bucketKeyOf = (t, period) =>
  period === 'month' ? monthKeyOf(t) : period === 'year' ? yearKeyOf(t) : quarterKeyOf(t);

const bucketLabel = (key, period) => {
  if (period === 'year') return key;
  if (period === 'month') return format(parseISO(`${key}-01`), 'MMM yy');
  const [year, q] = key.split('-Q');
  return `${QUARTER_LABELS[Number(q) - 1]} ${year.slice(2)}`;
};

/** Non-cumulative planned vs completed counts per bucket for the chosen period. */
export function periodBarData(tasks, period = 'quarter') {
  const map = new Map();
  tasks.forEach((t) => {
    const key = bucketKeyOf(t, period);
    if (!key) return;
    if (!map.has(key)) map.set(key, { bucketKey: key, planned: 0, completed: 0 });
    const row = map.get(key);
    row.planned += 1;
    if ((t.status || '') === 'Completed') row.completed += 1;
  });
  return [...map.values()]
    .sort((a, b) => a.bucketKey.localeCompare(b.bucketKey))
    .map((r) => ({ ...r, label: bucketLabel(r.bucketKey, period) }));
}

/** Cumulative planned vs completed per bucket for the chosen period. */
export function periodVelocityData(tasks, period = 'quarter') {
  let planned = 0;
  let completed = 0;
  return periodBarData(tasks, period).map((r) => {
    planned += r.planned;
    completed += r.completed;
    return { ...r, planned, completed };
  });
}

/** Headline metrics. */
export function summaryMetrics(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((t) => (t.status || '') === 'Completed').length;
  const overdue = tasks.filter(isOverdue).length;
  const offTrack = tasks.filter((t) => t.health === 'Off Track').length;
  const atRisk = tasks.filter((t) => t.health === 'At Risk').length;
  return { total, completed, overdue, atRisk, offTrack };
}