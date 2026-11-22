import { base44 } from '@/api/base44Client';
import { toIdOptions } from '@/lib/configNormalize';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { localNow } from '@/lib/localClock';

export const COMPLAINT_OBJECT_TYPE = 'complaint';
export const STATUS_OPTIONS = [{ name: 'Open', color: 'blue' }, { name: 'Closed', color: 'green' }];
export const SEVERITY_OPTIONS = [{ name: 'Low', color: 'green' }, { name: 'Medium', color: 'orange' }, { name: 'High', color: 'red' }];
const DEFAULT_CHANNEL_NAMES = ['Phone', 'Email', 'In-Person', 'Website', 'Social Media'];
const DEFAULT_CHANNELS = DEFAULT_CHANNEL_NAMES.map((name, i) => ({ id: `opt-${i + 1}`, name }));
/** Customiser system fields: built-in Complaint Channels are locked; user-added options stay editable. */
export const COMPLAINT_SYSTEM_FIELDS = [{ key: 'channels', field: 'channel', label: 'Complaint Channel', lockedNames: DEFAULT_CHANNEL_NAMES }];
/** Built-in channels always lead the list; saved user-added options follow. */
export const getComplaintOptions = (register) => {
  const extra = toIdOptions(register?.config?.channels, [])
    .filter((o) => o.name.trim() && !DEFAULT_CHANNEL_NAMES.some((d) => d.toLowerCase() === o.name.trim().toLowerCase()))
    .map((o, i) => ({ ...o, id: `opt-${DEFAULT_CHANNELS.length + i + 1}` }));
  return { channels: [...DEFAULT_CHANNELS, ...extra] };
};
export const channelOptions = (register) => getComplaintOptions(register).channels.map((o) => ({ name: o.name, color: 'gray' }));

export const CORRECTIVE_ACTION_OPTIONS = [{ name: 'Required', color: 'orange' }, { name: 'Not Required', color: 'gray' }];
export const ACTION_STATUS_OPTIONS = [{ name: 'Not Started', color: 'gray' }, { name: 'In Progress', color: 'blue' }, { name: 'Completed', color: 'green' }, { name: 'On Hold', color: 'orange' }];

export const complaintFilterFields = (register) => [
  { id: 'severity', label: 'Complaint Severity', values: SEVERITY_OPTIONS.map((o) => o.name) },
  { id: 'channel', label: 'Complaint Channel', values: channelOptions(register).map((o) => o.name) },
];
export const COMPLAINT_SORT_FIELDS = [{ id: 'complaint_date', label: 'Complaint Date' }];

/** Open complaints received more than 30 days ago are overdue (no target date is tracked). */
export const OVERDUE_DAYS = 30;
export function isComplaintOverdue(c) {
  if (c.status !== 'Open' || !c.complaint_date) return false;
  // Calendar-day comparison: complaint_date is date-only, so never parse it through UTC.
  return differenceInCalendarDays(localNow(), parseISO(c.complaint_date)) > OVERDUE_DAYS;
}

export const emptyComplaint = () => ({
  complaint_code: '', complaint_date: '', complainant_name: '', complainant_email: '', complainant_phone: '',
  status: 'Open', severity: '', taken_by: '', channel: '', details: '', root_cause: '',
  corrective_action: 'Required', action_status: 'Not Started', corrective_action_details: '', date_resolved: '', resolved_by: '', custom_fields: {},
});
export const pickComplaint = (c) => Object.fromEntries(Object.keys(emptyComplaint()).map((k) => [k, c?.[k] ?? '']));

const CODE_RE = /^CMP-(\d+)$/i;
export async function nextComplaintCode(registerId) {
  const page = await base44.entities.Complaint.filter({ register_id: registerId }, { limit: 1000, fields: ['complaint_code'] });
  const max = (page.items || []).reduce((m, c) => Math.max(m, Number(CODE_RE.exec(c.complaint_code || '')?.[1] || 0)), 0);
  return `CMP-${String(max + 1).padStart(3, '0')}`;
}

const REQUIRED = [['complaint_code', 'Complaint ID'], ['complaint_date', 'Complaint Date'], ['complainant_name', 'Complainant Name'], ['status', 'Complaint Status'], ['details', 'Complaint Description']];

export const complaintFieldErrors = (form) =>
  Object.fromEntries(REQUIRED.filter(([k]) => !String(form[k] ?? '').trim()).map(([k, l]) => [k, `${l} is required.`]));

/** Server check: { complaint_code } when the Complaint ID is already used in the register. */
export async function complaintCodeErrors(registerId, form, selfId) {
  const code = form.complaint_code.trim();
  const dupes = await base44.entities.Complaint.filter({ register_id: registerId, complaint_code: code }, { limit: 2, fields: ['id'] });
  return (dupes.items || []).some((d) => d.id !== selfId) ? { complaint_code: `Complaint ID ${code} is already in use.` } : {};
}

const toRecord = (f) => ({
  ...f,
  complaint_code: f.complaint_code.trim(),
  severity: f.severity || null,
  channel: f.channel || null,
  corrective_action: f.corrective_action || null,
  action_status: f.action_status || null,
  date_resolved: f.date_resolved || null,
  custom_fields: f.custom_fields || {},
});

export const listComplaints = (registerId) => base44.entities.Complaint.filter({ register_id: registerId }, '-complaint_date', 1000);
export const createComplaint = (registerId, form) => base44.entities.Complaint.create({ ...toRecord(form), register_id: registerId });
export const updateComplaint = (id, form) => base44.entities.Complaint.update(id, toRecord(form));
export const setComplaintsStatus = (ids, status) => base44.entities.Complaint.updateMany({ id: { $in: ids } }, { $set: { status } });
export const deleteComplaints = async (ids) => {
  const scope = { object_type: COMPLAINT_OBJECT_TYPE, object_id: { $in: ids } };
  await Promise.all([
    base44.entities.NotePage.deleteMany(scope),
    base44.entities.Document.deleteMany(scope),
    base44.entities.DocumentFolder.deleteMany(scope),
    base44.entities.ComplaintAction.deleteMany({ complaint_id: { $in: ids } }),
  ]);
  return base44.entities.Complaint.deleteMany({ id: { $in: ids } });
};

export function filterComplaints(items, { status, search, filters, sort }) {
  const q = search.trim().toLowerCase();
  const rows = items.filter((c) =>
    c.status === status &&
    (!q || [c.complaint_code, c.complainant_name, c.details, c.taken_by].some((v) => (v || '').toLowerCase().includes(q))) &&
    Object.entries(filters).every(([k, v]) => c[k] === v));
  if (!sort) return rows;
  const dir = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => ((a[sort.field] || '') > (b[sort.field] || '') ? dir : (a[sort.field] || '') < (b[sort.field] || '') ? -dir : 0));
}