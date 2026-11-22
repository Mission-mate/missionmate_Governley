/**
 * Membership Application form builder helpers.
 *
 * The application form for a plan is a Google-Forms-style list of questions,
 * stored on MembershipStructure.application_fields. Each question may OPTIONALLY
 * be mapped to an existing member profile field. When mapped, the answer is
 * written to the Member record on submission; otherwise it lives only in the
 * MembershipApplicationResponse history.
 */
import { MEMBER_SYSTEM_FIELDS, MEMBERSHIP_SYSTEM_CUSTOM_FIELDS } from '@/lib/memberSystemFields';
import { LOCKED_SYSTEM_FIELD_IDS } from '@/lib/membershipForm';

/**
 * Build the list of mappable member fields (system + custom) with normalised
 * type + options metadata for compatibility checks.
 * customFields = array of custom field defs for the 'membership' object.
 */
export function getMappableMemberFields(customFields = []) {
  // The locked core fields (First/Last Name, Email, Contact Number) already have
  // their own permanent questions mapped on every form — never offer them again.
  const system = MEMBER_SYSTEM_FIELDS
    .filter((f) => !LOCKED_SYSTEM_FIELD_IDS.includes(f.key))
    .map((f) => ({
    id: f.key,
    key: f.key,
    label: f.label,
    type: f.type, // 'Text' | 'Email' | 'Date'
    options: [],
    kind: 'system',
  }));
  // System-locked fields shown in Additional Details (e.g. Organisation) are
  // real Member columns too, so they're valid mapping targets.
  const systemLocked = MEMBERSHIP_SYSTEM_CUSTOM_FIELDS.map((f) => ({
    id: f.id,
    key: f.id,
    label: f.name,
    type: f.type,
    options: [],
    kind: 'system',
  }));
  const custom = (customFields || [])
    .map((f) => ({
      id: f.id,
      key: f.id,
      label: f.label || f.name || '',
      type: f.type,
      options: (f.options || []).map((o) => (typeof o === 'string' ? o : o.label ?? o.value ?? '')),
      kind: 'custom',
    }))
    .filter((f) => f.id && f.label.trim());
  return [...system, ...systemLocked, ...custom];
}

let _seq = 0;
const newAppFieldId = () =>
  `q_${Date.now().toString(36)}_${(_seq++).toString(36)}`;

export const normalizeAppFields = (arr) =>
  Array.isArray(arr) ? arr.map((f) => ({
    id: f.id || newAppFieldId(),
    type: f.type || 'Text',
    label: f.label || '',
    required: !!f.required,
    options: Array.isArray(f.options) ? f.options : [],
    map_to_field: f.map_to_field || '',
    map_to_type: f.map_to_type || '',
  })) : [];