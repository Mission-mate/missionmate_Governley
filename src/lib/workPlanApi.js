import { base44 } from '@/api/base44Client';
import { isCalendarYear, quarterOfMonthName } from '@/components/compliance/calendar/periodGrouping';
import { startYearFromDate } from '@/lib/financialYear';
import { deleteTaskWorkspace } from '@/lib/obligationTasks';
import { deleteAllWhere, settleAllDeletes } from '@/lib/cascadeDelete';
import { localNow } from '@/lib/localClock';

// ── Default board-governance category options ────────────────────────────────
const CATEGORY_OPTIONS = [
  'Board Meetings', 'AGM & Elections', 'Governance & Policy', 'Strategy & Planning',
  'Financial & Audit', 'Risk & Compliance', 'Reporting & Lodgements',
].map((name) => ({ name }));

// ── Default field definitions for a Work Plan ────────────────────────────────
const DEFAULT_FIELDS = [
  { id: 'category', label: 'Category', type: 'Single Select', system: false, config: { options: CATEGORY_OPTIONS } },
  {
    id: 'frequency',
    label: 'Frequency',
    type: 'Single Select',
    system: false,
    config: {
      options: [
        { name: 'One-off',   color: 'blue'   },
        { name: 'Monthly',   color: 'green'  },
        { name: 'Quarterly', color: 'orange' },
        { name: 'Annually',  color: 'purple' },
        { name: 'Ad Hoc',    color: 'blue'   },
        { name: 'Every',     color: 'green'  },
      ],
    },
  },
  { id: 'owner',    label: 'Owner',    type: 'Text/Number', system: false, config: {} },
  { id: 'due_date', label: 'Due Date', type: 'Date', system: true, config: {} },
  {
    id: 'priority',
    label: 'Priority',
    type: 'Single Select',
    system: false,
    config: {
      options: [
        { name: 'High',   color: 'red'    },
        { name: 'Medium', color: 'orange' },
        { name: 'Low',    color: 'green'  },
      ],
    },
  },
  {
    id: 'status',
    label: 'Status',
    type: 'Single Select',
    system: true,
    config: {
      options: [
        { name: 'Not Started', color: 'blue'   },
        { name: 'In Progress', color: 'orange' },
        { name: 'Completed',   color: 'green'  },
        { name: 'On Hold',     color: 'purple' },
        { name: 'Cancelled',   color: 'blue'   },
      ],
    },
  },
];

/** IDs of fields that are always system-locked. */
const SYSTEM_FIELD_IDS = ['status', 'due_date'];

const FIXED_FIELD_IDS = ['status', 'priority', 'frequency', 'due_date'];

/** Canonical field order, status last. */
const FIELD_ORDER = ['category', 'frequency', 'owner', 'due_date', 'priority', 'status'];

function normalizeFieldOrder(fields) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const ordered = FIELD_ORDER.map((id) => byId.get(id)).filter(Boolean);
  const extra = fields.filter((f) => !FIELD_ORDER.includes(f.id));
  return [...ordered, ...extra].map((f) => ({ ...f, system: SYSTEM_FIELD_IDS.includes(f.id) }));
}

/** Merge saved config fields with defaults, correcting older configs at runtime. */
export function resolveFields(config) {
  if (config?.fields && config.fields.length > 0) {
    const hasDue = config.fields.some((f) => f.id === 'due_date');
    // Legacy configs stored a Target Month field — superseded by Due Date.
    const source = config.fields.filter((f) => f.id !== 'target_month');
    const merged = source.map((f) => {
      const fixed = FIXED_FIELD_IDS.includes(f.id) ? DEFAULT_FIELDS.find((d) => d.id === f.id) : null;
      if (fixed) return { ...f, label: fixed.label, type: fixed.type, config: fixed.config };
      if (f.id === 'category' && (f.type !== 'Single Select' || !(f.config?.options?.length))) {
        const def = DEFAULT_FIELDS.find((d) => d.id === 'category');
        return { ...f, type: 'Single Select', config: def.config };
      }
      return f;
    });
    if (!hasDue) merged.push(DEFAULT_FIELDS.find((d) => d.id === 'due_date'));
    return normalizeFieldOrder(merged);
  }
  return DEFAULT_FIELDS;
}

// ── Work Plan CRUD ───────────────────────────────────────────────────────────
export function listWorkPlans() {
  return base44.entities.WorkPlan.filter({}, '-created_date');
}

export function createWorkPlan({
  title, description, status, compliance_period_type, financial_year_start, financial_year_end,
}) {
  return base44.entities.WorkPlan.create({
    title: title.trim(),
    description: description?.trim() || '',
    status: status || 'active',
    compliance_period_type: compliance_period_type || 'Financial Year',
    financial_year_start: financial_year_start || null,
    financial_year_end: financial_year_end || null,
    config: { fields: DEFAULT_FIELDS },
  });
}

export function updateWorkPlan(id, data) {
  return base44.entities.WorkPlan.update(id, data);
}

/** Persist the work plan's field configuration. */
export function saveWorkPlanConfig(workPlan, fields) {
  return base44.entities.WorkPlan.update(workPlan.id, {
    config: { ...(workPlan.config || {}), fields: normalizeFieldOrder(fields) },
  });
}

/**
 * Cascade delete a work plan: every work item's tasks first, then the work items
 * in a single batched call, then the plan itself. Each stage must fully succeed
 * before the next runs, so the plan is never removed while children survive.
 */
export async function deleteWorkPlan(id) {
  const items = await base44.entities.WorkItem.filter({ work_plan_id: id });
  if (items.length > 0) {
    await settleAllDeletes(items.map((i) => deleteTaskWorkspace('work_plan_item', i.id)), 'work item task sets');
    await deleteAllWhere('WorkItem', { work_plan_id: id });
  }
  return base44.entities.WorkPlan.delete(id);
}

// ── Work Item CRUD ───────────────────────────────────────────────────────────
export function listWorkItems(workPlanId) {
  return base44.entities.WorkItem.filter({ work_plan_id: workPlanId }, 'order_index');
}

export function createWorkItem(workPlanId, data) {
  return base44.entities.WorkItem.create({ work_plan_id: workPlanId, ...data });
}

export function updateWorkItem(id, data) {
  return base44.entities.WorkItem.update(id, data);
}

export async function deleteWorkItem(id) {
  await deleteTaskWorkspace('work_plan_item', id);
  return base44.entities.WorkItem.delete(id);
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Map a target month name to its concrete (year, monthIndex) within a work plan
 * period. Financial Year: Jul–Dec → start year, Jan–Jun → start year + 1.
 * Calendar Year: every month → start year.
 */
function resolveTargetMonth(monthName, workPlan) {
  const m = MONTH_NAMES.indexOf(monthName);
  if (m === -1) return null;
  const startYear = startYearFromDate(workPlan?.financial_year_start);
  if (!startYear) return null;
  if (isCalendarYear(workPlan?.compliance_period_type)) return { year: startYear, month: m };
  return { year: m <= 5 ? startYear + 1 : startYear, month: m };
}

/** ISO last day of a month name within the work plan period (library/import month values). */
export function monthEndDate(monthName, workPlan) {
  const resolved = resolveTargetMonth(monthName, workPlan);
  if (!resolved) return '';
  const pad = (n) => String(n).padStart(2, '0');
  const last = new Date(resolved.year, resolved.month + 1, 0).getDate();
  return `${resolved.year}-${pad(resolved.month + 1)}-${pad(last)}`;
}

/** Parse an ISO yyyy-MM-dd due date into { year, month } (month 0-based). */
function parseDue(iso) {
  const [y, m] = (iso || '').split('-').map((n) => parseInt(n, 10));
  return y && m ? { year: y, month: m - 1 } : null;
}

/** Month name of a due date, e.g. "July" (used when saving to the library). */
export function dueMonthName(iso) {
  const p = parseDue(iso);
  return p ? MONTH_NAMES[p.month] : '';
}

/** Month grouping/filter label for a due date, e.g. "July 2026". */
export function dueMonthLabel(iso) {
  const p = parseDue(iso);
  return p ? `${MONTH_NAMES[p.month]} ${p.year}` : '';
}

/** Quarter grouping/filter label for a due date within the plan period, e.g. "Q1 2026". */
export function dueQuarterLabel(iso, workPlan) {
  const p = parseDue(iso);
  if (!p) return '';
  const q = quarterOfMonthName(MONTH_NAMES[p.month], workPlan?.compliance_period_type || 'Financial Year');
  return q ? `${q} ${p.year}` : '';
}

/**
 * A work item is overdue once its due date has passed and it is not
 * Completed, Cancelled or On Hold. Measured against the device's local day.
 */
export function isDueOverdue(dueDate, status) {
  if (!dueDate || status === 'Completed' || status === 'Cancelled' || status === 'On Hold') return false;
  const now = localNow();
  const pad = (n) => String(n).padStart(2, '0');
  const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return dueDate < today;
}

export function formatDate(iso) {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch { return iso; }
}

/** Generate the next work item ID for a work plan. */
export function nextItemId(items) {
  const nums = items
    .map((a) => a.item_id)
    .filter(Boolean)
    .map((id) => parseInt(id.replace(/[^0-9]/g, ''), 10))
    .filter((n) => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `ITEM-${String(max + 1).padStart(3, '0')}`;
}

export const STATUS_STYLES = {
  'Not Started': { bg: 'bg-blue-100',   text: 'text-blue-700'   },
  'In Progress': { bg: 'bg-orange-100', text: 'text-orange-700' },
  'Completed':   { bg: 'bg-green-100',  text: 'text-green-700'  },
  'On Hold':     { bg: 'bg-purple-100', text: 'text-purple-700' },
  'Cancelled':   { bg: 'bg-gray-100',   text: 'text-gray-500'   },
};

export const PRIORITY_STYLES = {
  'High':   { bg: 'bg-red-100',   text: 'text-red-700'   },
  'Medium': { bg: 'bg-amber-100', text: 'text-amber-700' },
  'Low':    { bg: 'bg-green-100', text: 'text-green-700' },
};