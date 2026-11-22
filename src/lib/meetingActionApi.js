import { base44 } from '@/api/base44Client';
import { deleteAllWhere, settleAllDeletes } from '@/lib/cascadeDelete';
import { localToday } from '@/lib/localClock';
import { deleteTaskWorkspace } from '@/lib/obligationTasks';

// ── Default field definitions ──────────────────────────────────────────────
const DEFAULT_FIELDS = [
  // Meeting Title, Committee and Date are read from the linked Meeting record.
  { id: 'meeting_name',      label: 'Meeting Title',     type: 'Text/Number', system: true, config: {} },
  { id: 'meeting_committee', label: 'Meeting Committee', type: 'Text/Number', system: true, config: {} },
  { id: 'meeting_date',      label: 'Meeting Date',      type: 'Date',        system: true, config: {} },
  { id: 'minute_ref',    label: 'Minute/Agenda Reference', type: 'Text/Number', system: true, config: {} },
  {
    id: 'status',
    label: 'Status',
    type: 'Single Select',
    system: true, // locked — cannot be deleted or moved
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
  { id: 'assigned_to',  label: 'Assigned To',  type: 'Text/Number', system: false, config: {} },
  { id: 'raised_by',    label: 'Raised By',    type: 'Text/Number', system: false, config: {} },
  { id: 'due_date',     label: 'Due Date',     type: 'Date',        system: false, config: {} },
];

/** IDs of fields that are always system-locked (cannot be deleted or moved),
 *  in their fixed canonical display order. */
const SYSTEM_FIELD_IDS = ['meeting_name', 'meeting_committee', 'meeting_date', 'minute_ref', 'status'];

/** The meeting-detail fields — shown in the pane's Meeting Details section and
 *  in the table's Action cell rather than as their own columns. */
export const MEETING_FIELD_IDS = ['meeting_name', 'meeting_committee', 'meeting_date', 'minute_ref'];

/** Fields from older register configs that no longer exist. */
const RETIRED_FIELD_IDS = ['meeting_type'];

/** Force system fields to always lead, in canonical order, followed by the
 *  custom fields in their (drag-reorderable) order. Keeps older saved configs
 *  consistent and prevents system fields from being interleaved/moved. */
/** Canonical order for the built-in non-system fields, so legacy saved configs
 *  are corrected at runtime to: Priority, Assigned To, Raised By, Due Date. */
const BUILTIN_CUSTOM_ORDER = ['priority', 'assigned_to', 'raised_by', 'due_date'];

function normalizeFieldOrder(fields) {
  // System fields always come from DEFAULT_FIELDS, so a register saved before a
  // system field existed still gets it, with the current label and type.
  const system = SYSTEM_FIELD_IDS.map(id => DEFAULT_FIELDS.find(f => f.id === id));
  const custom = fields
    .filter(f => !SYSTEM_FIELD_IDS.includes(f.id) && !RETIRED_FIELD_IDS.includes(f.id))
    .map(f => ({ ...f, system: false }));
  // Sort built-in custom fields into their canonical order; keep user-added
  // custom fields after them in their existing order.
  custom.sort((a, b) => {
    const ai = BUILTIN_CUSTOM_ORDER.indexOf(a.id);
    const bi = BUILTIN_CUSTOM_ORDER.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
  return [...system, ...custom];
}

/** Merge saved config fields with defaults — preserved order from config.
 *  System fields are always the current DEFAULT_FIELDS definitions in canonical
 *  order; Priority keeps its saved visibility but always uses the default
 *  label, type and options so legacy saved values can't override them. */
export function resolveFields(config) {
  if (config?.fields && config.fields.length > 0) {
    const priority = DEFAULT_FIELDS.find(d => d.id === 'priority');
    const merged = config.fields.map(f => (
      f.id === 'priority' ? { ...f, label: priority.label, type: priority.type, config: priority.config } : f
    ));
    return normalizeFieldOrder(merged);
  }
  return DEFAULT_FIELDS;
}

// ── Register CRUD ─────────────────────────────────────────────────────────────
export function listMeetingActionRegisters(objectType, objectId) {
  return base44.entities.MeetingActionRegister.filter(
    { object_type: objectType, object_id: objectId },
    '-created_date'
  );
}

export async function createMeetingActionRegister({ title, description, status, objectType, objectId }) {
  return base44.entities.MeetingActionRegister.create({
    title: title.trim(),
    description: description?.trim() || '',
    status: status || 'active',
    is_locked: true,
    object_type: objectType,
    object_id: objectId,
    config: { fields: DEFAULT_FIELDS },
  });
}

/**
 * Update a register and, when the title changes, cascade the new title to every
 * MeetingActionRegisterLink that caches it — otherwise meeting profiles keep
 * showing the old register name.
 */
export async function updateMeetingActionRegister(id, data) {
  const updated = await base44.entities.MeetingActionRegister.update(id, data);
  if (data.title) {
    let more = true;
    while (more) {
      const res = await base44.entities.MeetingActionRegisterLink.updateMany(
        { register_id: id, register_title: { $ne: data.title } },
        { $set: { register_title: data.title } }
      );
      more = res?.has_more === true;
    }
  }
  return updated;
}

/**
 * Cascade delete a register: its actions' tasks, then all notes (batched via the
 * denormalized register_id), then the actions, then the register. Each stage must
 * fully succeed before the next runs, so the register is never removed while
 * orphaned actions, tasks or notes remain behind.
 */
export async function deleteMeetingActionRegister(id) {
  const actions = await base44.entities.MeetingActionItem.filter({ register_id: id });
  if (actions.length > 0) {
    await settleAllDeletes(
      actions.map(a => deleteActionDependents(a.id)),
      'action tasks, notes and documents'
    );
    await deleteAllWhere('MeetingActionItem', { register_id: id });
  }
  return base44.entities.MeetingActionRegister.delete(id);
}

// ── Action CRUD ───────────────────────────────────────────────────────────────
export function listActions(registerId) {
  return base44.entities.MeetingActionItem.filter({ register_id: registerId }, 'order_index');
}

// ── Linked meetings ───────────────────────────────────────────────────────────
const MONTH_NAMES = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Turn typed date text ("27 Aug 2026", "Aug 2026", "27/08/2026", "2026") into a
 *  pattern for the stored yyyy-mm-dd meeting date; null when the text isn't a date. */
export function meetingDatePattern(text) {
  const tokens = text.toLowerCase().split(/[\s/,.-]+/).filter(Boolean);
  let year; let month;
  const nums = [];
  for (const t of tokens) {
    const named = t.length >= 3 ? MONTH_NAMES.findIndex((n) => n.startsWith(t)) + 1 : 0;
    if (named && !month) month = named;
    else if (/^\d{4}$/.test(t) && !year) year = t;
    else if (/^\d{1,2}$/.test(t)) nums.push(Number(t));
    else return null;
  }
  // Numbers read as day then month, or month then day when the year was typed first.
  if (nums.length > (month ? 1 : 2)) return null;
  const yearFirst = /^\d{4}$/.test(tokens[0] || '');
  let day;
  if (month) [day] = nums;
  else if (yearFirst) [month, day] = nums;
  else [day, month] = nums;
  if ((month && (month < 1 || month > 12)) || (day && (day < 1 || day > 31))) return null;
  if (!year && !month && !day) return null;
  const pad = (n) => (n ? String(n).padStart(2, '0') : '\\d{2}');
  return `^${year || '\\d{4}'}-${pad(month)}-${pad(day)}`;
}

/** Meetings whose title or date matches the search text (newest first); all recent meetings when empty. */
export function searchMeetings(text) {
  if (!text) return base44.entities.Meeting.filter({}, '-meeting_date', 25);
  const byTitle = { title: { $regex: text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } };
  const datePattern = meetingDatePattern(text);
  const query = datePattern ? { $or: [byTitle, { meeting_date: { $regex: datePattern } }] } : byTitle;
  return base44.entities.Meeting.filter(query, '-meeting_date', 25);
}

export function listMeetingsByIds(ids) {
  return base44.entities.Meeting.filter({ id: { $in: ids } }, '-meeting_date', ids.length);
}

/** Add each action's meeting title, committee and date from its linked Meeting
 *  record. An action with no meeting, or whose meeting was deleted, gets blanks. */
export function withMeetingDetails(actions, meetings) {
  const byId = new Map(meetings.map(m => [m.id, m]));
  return actions.map(a => {
    const m = byId.get(a.meeting_id);
    return {
      ...a,
      meeting_name: m?.title || '',
      meeting_committee: m?.committee_name || '',
      meeting_date: m?.meeting_date || '',
    };
  });
}

/** One-line meeting summary shown under an action's title in the table and PDF. */
export function meetingMeta(action) {
  return [action.meeting_name, action.meeting_committee, action.meeting_date && formatDate(action.meeting_date), action.minute_ref]
    .filter(Boolean).join(' · ');
}

export function createAction(registerId, data) {
  return base44.entities.MeetingActionItem.create({ register_id: registerId, ...data });
}

export function updateAction(id, data) {
  return base44.entities.MeetingActionItem.update(id, data);
}

/** Remove an action's task workspace, note pages, document links and folders. */
function deleteActionDependents(id) {
  const scope = { object_type: 'meeting_action', object_id: id };
  return settleAllDeletes([
    deleteTaskWorkspace('meeting_action', id),
    deleteAllWhere('NotePage', scope),
    deleteAllWhere('Document', scope),
    deleteAllWhere('DocumentFolder', scope),
  ], 'action tasks, notes and documents');
}

/** Delete an action, clearing its dependents first so nothing is orphaned. */
export async function deleteAction(id) {
  await deleteActionDependents(id);
  return base44.entities.MeetingActionItem.delete(id);
}

// ── Helpers ────────────────────────────────────────────────────────────────────
export function isOverdue(dueDateIso, status, registerStatus) {
  if (!dueDateIso || status === 'Completed' || status === 'Cancelled' || status === 'On Hold') return false;
  // Actions moved to the Closed tab are no longer monitored as overdue.
  if (registerStatus === 'completed') return false;
  // Compared as plain dates against the device's local day — no UTC drift.
  return String(dueDateIso).slice(0, 10) < localToday();
}

// Display format for the register table: DD MMM YYYY (e.g. 02 May 2026)
export function formatDate(iso) {
  if (!iso) return '';
  try {
    const [y, m, d] = iso.split('-');
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
  } catch { return iso; }
}

/** Generate next action ID for a register */
export function nextActionId(actions) {
  const nums = actions
    .map(a => a.action_id)
    .filter(Boolean)
    .map(id => parseInt(id.replace(/[^0-9]/g, ''), 10))
    .filter(n => !isNaN(n));
  const max = nums.length > 0 ? Math.max(...nums) : 0;
  return `ACT-${String(max + 1).padStart(3, '0')}`;
}

export const STATUS_STYLES = {
  'Not Started':{ bg: 'bg-blue-100 dark:bg-blue-400/15',   text: 'text-blue-700 dark:text-blue-300'   },
  'Active':     { bg: 'bg-blue-100 dark:bg-blue-400/15',   text: 'text-blue-700 dark:text-blue-300'   },
  'Open':       { bg: 'bg-blue-100 dark:bg-blue-400/15',   text: 'text-blue-700 dark:text-blue-300'   },
  'In Progress':{ bg: 'bg-orange-100 dark:bg-orange-400/15', text: 'text-orange-700 dark:text-orange-300' },
  'Completed':  { bg: 'bg-green-100 dark:bg-green-400/15',  text: 'text-green-700 dark:text-green-300'  },
  'On Hold':    { bg: 'bg-purple-100 dark:bg-purple-400/15', text: 'text-purple-700 dark:text-purple-300' },
  'Cancelled':  { bg: 'bg-gray-100 dark:bg-muted',   text: 'text-gray-500 dark:text-muted-foreground'   },
  'Deferred':   { bg: 'bg-purple-100 dark:bg-purple-400/15', text: 'text-purple-700 dark:text-purple-300' },
};

export const PRIORITY_STYLES = {
  'High':   { bg: 'bg-red-100 dark:bg-red-400/15',    text: 'text-red-700 dark:text-red-300'    },
  'Medium': { bg: 'bg-amber-100 dark:bg-amber-400/15',  text: 'text-amber-700 dark:text-amber-300'  },
  'Low':    { bg: 'bg-green-100 dark:bg-green-400/15',  text: 'text-green-700 dark:text-green-300'  },
};