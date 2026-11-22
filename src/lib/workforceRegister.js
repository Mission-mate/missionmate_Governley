import { base44 } from '@/api/base44Client';
import { localToday } from '@/lib/localClock';

export const ARCHIVED = 'Archived';
export const PERSON_TYPES = ['Employee', 'Volunteer', 'Contractor', 'Board Member', 'Other'].map((name) => ({ name }));
export const STATUS_OPTIONS = [{ name: 'Active', color: 'green' }, { name: 'Archived', color: 'gray' }];
export const STATUS_DOTS = [{ name: 'Active', dot: 'bg-green-500' }, { name: 'Archived', dot: 'bg-gray-400' }];
export const VALIDITY_OPTIONS = [{ name: 'Current', color: 'green' }, { name: 'Expired', color: 'red' }];
export const VERIFICATION_OPTIONS = [{ name: 'Verified', color: 'green' }, { name: 'Pending', color: 'orange' }, { name: 'Exempted', color: 'blue' }];
export const COMPLIANCE_OPTIONS = [{ name: 'On Track', color: 'green' }, { name: 'At Risk', color: 'orange' }];
/** Credentials expiring within this many days show an amber "Expires in" warning. */
export const EXPIRY_WARNING_DAYS = 60;

/** Records without a stored status are Active. */
export const statusOf = (r) => (r?.status === ARCHIVED ? ARCHIVED : 'Active');

const norm = (s) => String(s || '').trim().toLowerCase();
export const isNameTaken = (people, name, exceptId) => people.some((p) => p.id !== exceptId && norm(p.full_name) === norm(name));
export function personErrors(p, people, exceptId) {
  if (!String(p.full_name || '').trim()) return { full_name: 'Full name is required.' };
  if (isNameTaken(people, p.full_name, exceptId)) return { full_name: 'A person with this name already exists.' };
  return {};
}

export const todayISO = localToday;
export function credentialErrors(c) {
  return {
    ...(!String(c.credential_name || '').trim() && { credential_name: 'Select a credential type.' }),
    ...(c.verified_date && c.verified_date > todayISO() && { verified_date: 'Date verified cannot be in the future.' }),
  };
}

export const emptyPerson = () => ({ full_name: '', person_type: 'Employee', role: '', program_area: '', email: '', status: 'Active' });
export const emptyCredential = () => ({
  credential_name: '', reference_number: '', jurisdiction: '', issue_date: '', no_expiry: false, expiry_date: '',
  verification_status: 'Pending', verified_by: '', verified_date: '', restricted: false, note: '', status: 'Active',
});
const pick = (src, tpl) => Object.fromEntries(Object.keys(tpl).map((k) => [k, src?.[k] ?? tpl[k]]));
export const pickPerson = (p) => ({ ...pick(p, emptyPerson()), status: statusOf(p) });
export const pickCredential = (c) => ({ id: c.id, ...pick(c, emptyCredential()), status: statusOf(c) });

const startOfToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
/** Days from today to expiry (negative = expired); null when no expiry. */
export function daysToExpiry(c) {
  if (!c || c.no_expiry || !c.expiry_date) return null;
  return Math.round((new Date(`${c.expiry_date}T00:00:00`) - startOfToday()) / 86400000);
}
/** Validity is always derived from the expiry date. */
export const validityOf = (c) => ((daysToExpiry(c) ?? 0) < 0 ? 'Expired' : 'Current');
export const maskRef = (r) => (r ? `••••${String(r).slice(-4)}` : '');

export const listPeople = (registerId) => base44.entities.WorkforcePerson.filter({ register_id: registerId }, 'full_name', 1000);
export const listCredentials = (registerId) => base44.entities.WorkforceCredential.filter({ register_id: registerId }, 'credential_name', 2000);

export const createPerson = (registerId, person) => base44.entities.WorkforcePerson.create({ ...person, register_id: registerId, status: 'Active' });
export const updatePerson = (id, person) => base44.entities.WorkforcePerson.update(id, person);

async function updateAll(query, set) {
  let res;
  do { res = await base44.entities.WorkforceCredential.updateMany(query, { $set: set }); } while (res?.has_more);
}

/**
 * Archiving a person archives their Active credentials (flagged archived_with_person);
 * restoring the person restores only those, so each credential returns to its prior status.
 */
export async function setPersonStatus(personId, status) {
  await updatePerson(personId, { status });
  if (status === ARCHIVED) await updateAll({ person_id: personId, status: { $ne: ARCHIVED } }, { status: ARCHIVED, archived_with_person: true });
  else await updateAll({ person_id: personId, archived_with_person: true }, { status: 'Active', archived_with_person: false });
}

export function saveCredential(registerId, personId, { id, ...c }, prevStatus) {
  const row = { ...c, register_id: registerId, person_id: personId, expiry_date: c.no_expiry ? '' : c.expiry_date };
  // A manual status change ends the link to the person's archive cascade.
  if (!id || c.status !== prevStatus) row.archived_with_person = false;
  return id ? base44.entities.WorkforceCredential.update(id, row) : base44.entities.WorkforceCredential.create(row);
}
export const setCredentialStatus = (id, status) => base44.entities.WorkforceCredential.update(id, { status, archived_with_person: false });
export const deleteCredential = (id) => base44.entities.WorkforceCredential.delete(id);

export async function deletePeople(ids) {
  await base44.entities.WorkforceCredential.deleteMany({ person_id: { $in: ids } });
  await base44.entities.WorkforcePerson.deleteMany({ id: { $in: ids } });
}

/** System credential types are always available and can never be deleted. */
export const SYSTEM_CREDENTIAL_TYPES = ['Working With Children', 'National Police Check'];
export const getCustomCredentialTypes = (register) => register?.config?.credential_types || [];
export const credentialTypeNames = (register) => [...SYSTEM_CREDENTIAL_TYPES, ...getCustomCredentialTypes(register).map((t) => t.name)];
export const countCredentialsOfType = (registerId, name) => base44.entities.WorkforceCredential.count({ register_id: registerId, credential_name: name });

/** Saves custom types; renames cascade to existing credentials, deletions leave them unchanged. */
export async function saveCredentialTypes(register, types) {
  const prev = Object.fromEntries(getCustomCredentialTypes(register).map((t) => [t.id, t.name]));
  for (const t of types) {
    if (prev[t.id] && prev[t.id] !== t.name) {
      await base44.entities.WorkforceCredential.updateMany({ register_id: register.id, credential_name: prev[t.id] }, { $set: { credential_name: t.name } });
    }
  }
  await base44.entities.ComplianceManagedRegister.update(register.id, { config: { ...(register.config || {}), credential_types: types } });
}

export const peopleFilterFields = [
  { id: 'person_type', label: 'Person Type', values: PERSON_TYPES.map((o) => o.name) },
  { id: 'compliance', label: 'Compliance', values: COMPLIANCE_OPTIONS.map((o) => o.name) },
];
export const credentialFilterFields = (register) => [
  { id: 'credential_name', label: 'Credential', values: credentialTypeNames(register) },
  { id: 'person_type', label: 'Person Type', values: PERSON_TYPES.map((o) => o.name) },
  { id: 'validity', label: 'Validity', values: VALIDITY_OPTIONS.map((o) => o.name) },
  { id: 'verification_status', label: 'Verification', values: VERIFICATION_OPTIONS.map((o) => o.name) },
];

/** Joined credential rows (credential + person + validity) after search and filters. */
export function buildRows(people, creds, { search = '', filters = {} } = {}) {
  const byId = Object.fromEntries(people.map((p) => [p.id, p]));
  const q = norm(search);
  return creds.filter((c) => byId[c.person_id]).map((c) => ({ ...c, person: byId[c.person_id], validity: validityOf(c) }))
    .filter((r) => (!q || [r.credential_name, r.person.full_name, r.person.role, r.jurisdiction].some((v) => norm(v).includes(q)))
      && Object.entries(filters).every(([k, v]) => (k === 'person_type' ? r.person.person_type : r[k]) === v));
}

const byExpiry = (a, b) => (daysToExpiry(a) ?? Infinity) - (daysToExpiry(b) ?? Infinity);

/**
 * Orders credential rows for the main register and, when grouped, splits them into sections
 * (by person name or credential type; soonest expiry first within each). `rows` is the flat
 * order so pagination slices keep sections contiguous.
 */
export function groupCredentialRows(rows, groupBy) {
  if (!groupBy) {
    return { rows: [...rows].sort((a, b) => a.credential_name.localeCompare(b.credential_name) || a.person.full_name.localeCompare(b.person.full_name)), groups: null };
  }
  const keyOf = (r) => (groupBy === 'person' ? r.person_id : r.credential_name);
  const map = new Map();
  rows.forEach((r) => {
    const k = keyOf(r);
    if (!map.has(k)) map.set(k, { key: k, label: groupBy === 'person' ? r.person.full_name : r.credential_name, rows: [] });
    map.get(k).rows.push(r);
  });
  const groups = [...map.values()].sort((a, b) => a.label.localeCompare(b.label));
  groups.forEach((g) => g.rows.sort(byExpiry));
  return { rows: groups.flatMap((g) => g.rows), groups };
}

/** Person compliance from Active credentials only: any Expired → At Risk, otherwise On Track. */
function complianceFor(own) {
  if (!own.length) return '';
  return own.some((c) => validityOf(c) === 'Expired') ? 'At Risk' : 'On Track';
}

/** Calculated governance values from a person's Active credentials. */
export function personStats(creds, personId) {
  const own = creds.filter((c) => c.person_id === personId && statusOf(c) === 'Active');
  const dated = own.filter((c) => daysToExpiry(c) !== null).sort((a, b) => daysToExpiry(a) - daysToExpiry(b));
  const nextExpiry = dated[0] || null;
  return { count: own.length, nextExpiry, compliance: complianceFor(own), pending: own.filter((c) => c.verification_status === 'Pending').length };
}

/** Shared summary metrics — archived people and archived credentials are excluded. */
export function summaryCounts(people, creds) {
  const active = new Set(people.filter((p) => statusOf(p) === 'Active').map((p) => p.id));
  const live = creds.filter((c) => active.has(c.person_id) && statusOf(c) === 'Active');
  return {
    people: active.size,
    credentials: live.length,
    expired: live.filter((c) => validityOf(c) === 'Expired').length,
    pending: live.filter((c) => c.verification_status === 'Pending').length,
  };
}