import { base44 } from '@/api/base44Client';
import { toIdOptions } from '@/lib/configNormalize';
import { STATUS_OPTIONS as DECLARANT_STATUS_OPTIONS, ARCHIVED } from '@/lib/donorRegister';

export { DECLARANT_STATUS_OPTIONS, ARCHIVED };

/**
 * Conflict of Interest Register — declarants (CoiPerson, parent) and their
 * declarations (ConflictOfInterest, child, linked via member_user_id).
 */
export const PERSON_TYPE_DEFAULTS = [
  { name: 'Director', color: 'blue' }, { name: 'Committee Member', color: 'purple' }, { name: 'Staff', color: 'green' },
  { name: 'Volunteer', color: 'orange' }, { name: 'Contractor', color: 'gray' },
];
const PERSON_TYPE_SEEDS = PERSON_TYPE_DEFAULTS.map((o, i) => ({ ...o, id: `opt-${i + 1}` }));

/** Customise pane system field: options can be added, but the field and seeded options are locked. */
export const DECLARANT_SYSTEM_FIELDS = [
  { key: 'person_types', field: 'person_type', label: 'Person Type', lockedNames: PERSON_TYPE_DEFAULTS.map((o) => o.name) },
];
export const getDeclarantOptions = (register) => ({ person_types: toIdOptions(register?.config?.person_types, PERSON_TYPE_SEEDS) });
/** [{ name, color }] for selects, badges and filters. */
export const personTypeOptions = (register) =>
  getDeclarantOptions(register).person_types.map((o) => ({ name: o.name, color: o.color || 'gray' }));

/** Customiser entity: option renames apply to declarants; custom-column cleanup to declarations. */
export const CUSTOMISER_ENTITY = {
  count: (q) => base44.entities.CoiPerson.count(q),
  updateMany: (q, u) => base44.entities.CoiPerson.updateMany(q, u),
  filter: (...a) => base44.entities.ConflictOfInterest.filter(...a),
  bulkUpdate: (rows) => base44.entities.ConflictOfInterest.bulkUpdate(rows),
};

/** Next sequential Declarant ID (D-0001 style). */
/** Declarations belonging to Active (non-archived) declarants only. */
export function activeDeclarations(conflicts, people) {
  const active = new Set(people.filter((p) => p.status !== ARCHIVED).map((p) => p.id));
  return conflicts.filter((c) => active.has(c.member_user_id));
}

export function nextDeclarantId(people) {
  const max = people.reduce((m, p) => {
    const match = /^D-(\d+)$/i.exec(p.declarant_code || '');
    return match ? Math.max(m, Number(match[1])) : m;
  }, 0);
  return `D-${String(max + 1).padStart(4, '0')}`;
}

const RISK_RANK = { High: 3, Medium: 2, Low: 1 };

/** Calculated governance values for one declarant from the register's declarations. */
export function declarantStats(conflicts, personId) {
  const open = conflicts.filter((c) => c.member_user_id === personId && (c.status || 'Open') === 'Open');
  const highest = open.reduce((best, c) => ((RISK_RANK[c.risk_exposure] || 0) > (RISK_RANK[best] || 0) ? c.risk_exposure : best), '');
  return { openCount: open.length, highestRisk: highest };
}

export const isNameTaken = (people, name, selfId) => {
  const n = name.trim().toLowerCase();
  return people.some((p) => p.id !== selfId && (p.full_name || '').trim().toLowerCase() === n);
};

export function createDeclarant(registerId, people, form) {
  return base44.entities.CoiPerson.create({
    register_id: registerId,
    declarant_code: nextDeclarantId(people),
    full_name: form.name.trim(),
    role: form.role.trim(),
    person_type: form.person_type || '',
    division: (form.division || '').trim(),
    email: (form.email || '').trim(),
    status: 'Active',
  });
}