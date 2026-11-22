// Per-tab configuration for the WHS workspace: entity, search, filters, tiles, columns.
import { localToday } from '@/lib/localClock';
import { CHECK_FREQUENCIES } from '@/lib/whsCheckFields';
import { OPEN_CLOSED, ACTION_STAGES, HIGH_AND_ABOVE, SOURCE_TYPES } from '@/lib/whsRegister';

export const STATUS_PILL = {
  Open: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Closed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'Not Started': 'bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  High: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  Medium: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300',
  Low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
};

const T = {
  blue: { tint: 'oklch(0.94 0.045 250)', labelColor: 'oklch(0.5 0.06 250)', gradient: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))' },
  teal: { tint: 'oklch(0.93 0.05 185)', labelColor: 'oklch(0.5 0.07 190)', gradient: 'linear-gradient(135deg, oklch(0.5 0.11 190), oklch(0.68 0.09 180))' },
  amber: { tint: 'oklch(0.94 0.06 75)', labelColor: 'oklch(0.52 0.08 65)', gradient: 'linear-gradient(135deg, oklch(0.6 0.14 60), oklch(0.75 0.12 80))' },
  red: { tint: 'oklch(0.93 0.055 25)', labelColor: 'oklch(0.53 0.08 25)', gradient: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))' },
};


/** Tile queries are evaluated lazily so "today" is always current. */
export const WHS_TABS = {
  hazards: {
    sourceType: 'hazard',
    sorts: [{ id: 'date_raised', label: 'Date Raised' }, { id: 'next_review_date', label: 'Next Review' }],
    groups: [{ key: 'category', label: 'Category' }, { key: 'risk_rating', label: 'Risk Rating' }],
    label: 'Hazards', tabLabel: 'Hazard Register', noun: 'hazard', entity: 'WhsHazard', addLabel: 'Add Hazard', sort: '-created_date',
    searchFields: ['title', 'description', 'hazard_code', 'location'], statuses: OPEN_CLOSED,
    filters: [
      { id: 'category', label: 'Category', configKey: 'hazard_categories' },
      { id: 'risk_rating', label: 'Risk Rating', values: ['Very Low', 'Low', 'Tolerable', 'High', 'Very High'] },
    ],
    tiles: () => [
      { label: 'Total Hazards', query: {}, total: true, ...T.blue },
      { label: 'status', query: {}, ...T.teal },
      { label: 'High and Above', query: { risk_rating: { $in: HIGH_AND_ABOVE } }, ...T.amber },
      { label: 'Overdue Review', query: { next_review_date: { $lt: localToday() } }, openOnly: true, ...T.red },
    ],
    columns: [
      { key: 'hazard_code', label: 'ID', kind: 'code' },
      { key: 'title', label: 'Hazard', kind: 'title', sub: 'description',
        meta: [{ key: 'category', label: 'Category' }, { key: 'owner', label: 'Hazard Owner', avatar: true }] },
      { key: 'risk_rating', label: 'Risk Rating', kind: 'rating' },
      { key: 'date_raised', label: 'Date Raised', kind: 'date' },
      { key: 'next_review_date', label: 'Next Review Date', kind: 'date', overdue: true, width: 170 },
    ],
  },
  incidents: {
    sourceType: 'incident',
    sorts: [{ id: 'incident_date', label: 'Date' }],
    groups: [{ key: 'incident_type', label: 'Type' }, { key: 'location', label: 'Location' }],
    label: 'Incidents', tabLabel: 'Incident Register', noun: 'incident', entity: 'WhsIncident', addLabel: 'Report Incident', sort: '-incident_date',
    searchFields: ['title', 'description', 'incident_code', 'location'], statuses: OPEN_CLOSED,
    filters: [
      { id: 'incident_type', label: 'Incident Type', configKey: 'incident_types' },
      { id: 'treatment', label: 'Treatment', configKey: 'treatments' },
      { id: 'investigation_required', label: 'Investigation Required', values: ['Yes', 'No'] },
      { id: 'regulator_notification', label: 'Regulator Notifiable', values: ['Yes', 'Not Required'] },
    ],
    tiles: () => [
      { label: 'Total Incidents', query: {}, total: true, ...T.blue },
      { label: 'status', query: {}, ...T.teal },
      { label: 'Notifiable', query: { regulator_notification: 'Yes' }, ...T.amber },
      { label: 'Major and Above', query: { business_impact: { $in: ['Major', 'Catastrophic'] } }, ...T.red },
    ],
    columns: [
      { key: 'incident_code', label: 'ID', kind: 'code' },
      { key: 'title', label: 'Incident', kind: 'title', sub: 'description',
        meta: [{ key: 'incident_type', label: 'Incident Type' }, { key: 'treatment', label: 'Treatment' }] },
      { key: 'incident_date', label: 'Incident Date', kind: 'date' },
      { key: 'location', label: 'Location', width: 153 },
      { key: 'investigation_required', label: 'Investigation Required', width: 200 },
      { key: 'regulator_notification', label: 'Regulator Notifiable', width: 185 },
    ],
  },
  checks: {
    sourceType: 'safety_check',
    sorts: [{ id: 'date_last_done', label: 'Last Done' }, { id: 'next_due', label: 'Next Due' }],
    groups: [{ key: 'owner', label: 'Owner' }, { key: 'frequency', label: 'Frequency' }],
    label: 'Safety Checks', tabLabel: 'Safety Audit Register', noun: 'safety check', entity: 'WhsSafetyCheck', addLabel: 'Add Safety Check', sort: 'next_due',
    searchFields: ['title', 'check_code', 'location'], statuses: OPEN_CLOSED,
    filters: [{ id: 'frequency', label: 'Frequency', values: CHECK_FREQUENCIES.map((f) => f.name) }],
    tiles: () => [
      { label: 'Total Checks', query: {}, total: true, ...T.blue },
      { label: 'status', query: {}, ...T.teal },
      { label: 'Recurring', query: { frequency: { $in: ['Monthly', 'Quarterly', 'Annually', 'Every'] } }, ...T.amber },
      { label: 'Overdue', query: { next_due: { $lt: localToday() } }, openOnly: true, ...T.red },
    ],
    columns: [
      { key: 'check_code', label: 'ID', kind: 'code' },
      { key: 'title', label: 'Safety Check', kind: 'title', sub: 'description' },
      { key: 'owner', label: 'Owner', kind: 'person' },
      { key: 'frequency', label: 'Frequency', kind: 'label', options: CHECK_FREQUENCIES },
      { key: 'date_last_done', label: 'Last Done', kind: 'date' },
      { key: 'next_due', label: 'Next Due', kind: 'date', overdue: true },
    ],
  },
  actions: {
    sourceType: null,
    sorts: [{ id: 'due_date', label: 'Due' }],
    groups: [{ key: 'source_type', label: 'Source' }, { key: 'stage', label: 'Stage' }],
    label: 'Actions', tabLabel: 'Action Register', noun: 'action', entity: 'WhsAction', addLabel: null, sort: 'due_date',
    searchFields: ['title', 'action_required', 'action_code', 'source_code'], statuses: OPEN_CLOSED,
    filters: [
      { id: 'source_type', label: 'Source', values: Object.keys(SOURCE_TYPES) },
      { id: 'stage', label: 'Stage', values: ACTION_STAGES },
    ],
    tiles: () => [
      { label: 'Total Actions', query: {}, total: true, ...T.blue },
      { label: 'status', query: {}, ...T.teal },
      { label: 'Overdue', query: { due_date: { $lt: localToday() } }, openOnly: true, ...T.red },
      { label: 'Completed', query: { stage: 'Completed' }, ...T.amber },
    ],
    columns: [
      { key: 'action_code', label: 'ID', kind: 'code' },
      { key: 'title', label: 'Action', kind: 'title', sub: 'action_required' },
      { key: 'source_type', label: 'Source', kind: 'source', width: 150 },
      { key: 'owner', label: 'Owner', kind: 'person', width: 240 },
      { key: 'due_date', label: 'Due', kind: 'date', overdue: true, width: 160 },
      { key: 'stage', label: 'Stage', kind: 'pill', width: 160 },
    ],
  },
};

/** Open/Closed lifecycle column — always the last column on every WHS tab, after custom fields. */
export const STATUS_COLUMN = { key: 'status', label: 'Status', kind: 'pill', width: 120 };

/** Dot colour per status for the floating bar's Change Status menu. */
export const STATUS_DOT = {
  Open: 'bg-blue-500', Closed: 'bg-emerald-500', 'Not Started': 'bg-slate-400',
  'In Progress': 'bg-blue-500', Completed: 'bg-emerald-500', 'On Hold': 'bg-amber-500',
};

/** Default column widths by cell kind; the title column takes the remaining space. */
const KIND_WIDTH = { code: 110, date: 130, pill: 130, rating: 140 };
export const columnWidth = (col) => (col.kind === 'title' ? undefined : col.width || KIND_WIDTH[col.kind] || 170);

/** Server query for the current tab state. */
export function buildWhsQuery(registerId, cfg, { status, search, filters }) {
  const q = { register_id: registerId, ...filters };
  if (status !== 'All') q.status = status;
  const s = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  if (s) q.$or = cfg.searchFields.map((f) => ({ [f]: { $regex: s, $options: 'i' } }));
  return q;
}