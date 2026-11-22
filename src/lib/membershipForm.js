/**
 * Shared definitions for the public Membership Form Builder & the public form.
 *
 * System fields map directly onto Member columns. Custom fields come from the
 * shared custom_fields AppConfig under the 'membership' object key and are
 * rendered using the same controls as the rest of the app.
 */

export const FORM_CONFIG_SLUG = 'default';

// Built-in fields. `locked` fields (First Name, Last Name, Email, Contact
// Number) are always present on the form, cannot be removed, and are permanently
// mapped to their matching member profile field. They can only be reordered.
// Everything else is optional: admins can toggle it on/off and choose whether
// it's required.
const SYSTEM_FIELDS = [
  { field_id: 'first_name', label: 'First Name', type: 'Text', required: true, locked: true, category: 'Personal Info' },
  { field_id: 'last_name', label: 'Last Name', type: 'Text', required: true, locked: true, category: 'Personal Info' },
  { field_id: 'email', label: 'Email', type: 'Text', required: true, locked: true, category: 'Personal Info' },
  { field_id: 'phone', label: 'Contact Number', type: 'Phone', required: true, locked: true, category: 'Personal Info' },
  { field_id: 'organisation', label: 'Organisation', type: 'Text', required: false, category: 'Personal Info' },
  { field_id: 'street_address', label: 'Street Address', type: 'Text', required: false, category: 'Address' },
  { field_id: 'suburb', label: 'Suburb', type: 'Text', required: false, category: 'Address' },
  { field_id: 'state', label: 'State', type: 'Text', required: false, category: 'Address' },
  { field_id: 'postal_code', label: 'Postal Code', type: 'Text', required: false, category: 'Address' },
];

export const getSystemField = (id) => SYSTEM_FIELDS.find((f) => f.field_id === id) || null;

// The locked system fields that must always be on the form, pre-mapped and non-removable.
export const LOCKED_SYSTEM_FIELD_IDS = SYSTEM_FIELDS.filter((f) => f.locked).map((f) => f.field_id);

export const isLockedSystemField = (field) =>
  field?.kind === 'system' && LOCKED_SYSTEM_FIELD_IDS.includes(field.field_id);

// Question types available when adding a custom question directly on the form.
export const QUESTION_TYPES = [
  { value: 'Text', label: 'Text', hasOptions: false },
  { value: 'Number', label: 'Number', hasOptions: false },
  { value: 'Date', label: 'Date', hasOptions: false },
  { value: 'Dropdown (Single Select)', label: 'Dropdown (Single Select)', hasOptions: true },
  { value: 'Dropdown (Multi-Select)', label: 'Dropdown (Multi-Select)', hasOptions: true },
  { value: 'Long Text', label: 'Long Text', hasOptions: false },
  { value: 'Radio Button', label: 'Radio Button', hasOptions: true },
  { value: 'Checkbox', label: 'Checkbox', hasOptions: true },
  { value: 'File Upload', label: 'File Upload', hasOptions: false },
];

export const questionTypeHasOptions = (type) =>
  !!QUESTION_TYPES.find((t) => t.value === type)?.hasOptions;

/**
 * Mapping compatibility — a question's answer can only be written to a member
 * profile field of the same underlying data shape. Both the question types and
 * the target field types are normalised to a canonical type, then matched exactly.
 */
const CANONICAL_TYPE = {
  'text': 'Text',
  'email': 'Text',
  'phone': 'Text',
  'number': 'Number',
  'date': 'Date',
  'long text': 'Long Text',
  'textarea': 'Long Text',
  'dropdown (single select)': 'Single Select',
  'single select': 'Single Select',
  'select': 'Single Select',
  'radio button': 'Single Select',
  'radio': 'Single Select',
  'dropdown (multi-select)': 'Multi Select',
  'multi select': 'Multi Select',
  'multi-select': 'Multi Select',
  'checkbox': 'Multi Select',
  'file upload': 'File Upload',
  'file': 'File Upload',
};

export const canonicalFieldType = (type) =>
  CANONICAL_TYPE[String(type || '').trim().toLowerCase()] || String(type || '').trim();

export const isMappingCompatible = (questionType, targetType) =>
  canonicalFieldType(questionType) === canonicalFieldType(targetType);

/**
 * Returns a human sentence explaining why the mapping is invalid, or null when
 * the mapping is fine (or there is nothing to validate).
 */
export function getMappingIncompatibilityReason(questionType, targetField) {
  if (!targetField || !questionType) return null;
  if (isMappingCompatible(questionType, targetField.type)) return null;
  return `${targetField.label} is a ${targetField.type} field and can't receive ${questionType} answers.`;
}

const newQuestionId = () => `q_${crypto.randomUUID()}`;

// A blank inline question added via "+ Add Question". Self-contained on the
// form layout — carries its own type & options, no pre-defined custom field needed.
export const makeQuestion = () => ({
  field_id: newQuestionId(),
  kind: 'custom',
  label: '',
  type: 'Text',
  options: [],
  placeholder: '',
  mandatory: false,
  map_to_field: '',
  enabled: true,
  hidden: false,
  visibility_plans: [],
});

/**
 * Resolve a layout field's effective custom definition — either the matching
 * AppConfig custom field (legacy) or the field's own inline definition
 * (new "+ Add Question" flow). Returns a shape the CustomFieldEdit renderer accepts.
 */
export function resolveCustomDef(layoutField, customById = {}) {
  const existing = customById[layoutField.field_id];
  if (existing) return existing;
  if (layoutField.kind !== 'custom') return null;
  return {
    id: layoutField.field_id,
    name: layoutField.label || 'Question',
    label: layoutField.label || 'Question',
    type: layoutField.type || 'Text',
    options: layoutField.options || [],
  };
}

/**
 * Build the default layout. `enabled` means the field is placed on the form
 * canvas. The four locked system fields (name, email, contact number) start
 * enabled, mandatory, and mapped to their member profile field. All other
 * fields start off-canvas so the admin builds the rest from scratch.
 */
function buildDefaultLayout(customFields = []) {
  const system = SYSTEM_FIELDS.map((f) => ({
    field_id: f.field_id,
    label: f.label,
    kind: 'system',
    mandatory: f.required,
    enabled: !!f.locked,
    ...(f.locked ? { map_to_field: f.field_id } : {}),
  }));
  const custom = (customFields || []).map((cf) => ({
    field_id: cf.id,
    label: cf.name,
    kind: 'custom',
    mandatory: false,
    enabled: false,
  }));
  return [...system, ...custom];
}

/**
 * Reconcile a saved layout against the current custom field definitions:
 * keep saved entries that still exist, append newly created custom fields.
 */
export function reconcileLayout(savedLayout, customFields = []) {
  const base = buildDefaultLayout(customFields);
  if (!savedLayout || savedLayout.length === 0) return base;

  const validIds = new Set(base.map((f) => f.field_id));

  // Keep saved entries that still exist, plus self-contained inline questions
  // added via "+ Add Question" (kind 'custom' carrying their own `type`, so they
  // don't depend on an AppConfig definition). De-duped by field_id — a corrupted
  // save could contain the same field twice, never carry duplicates forward.
  // Legacy references to deleted AppConfig custom fields have no `type` and so
  // still fall out here.
  const isInlineQuestion = (f) => f.kind === 'custom' && !!f.type;
  const kept = [];
  const seen = new Set();
  for (const f of savedLayout) {
    if ((validIds.has(f.field_id) || isInlineQuestion(f)) && !seen.has(f.field_id)) {
      seen.add(f.field_id);
      kept.push(f);
    }
  }

  // Append any base field (system or custom) not already present, off-canvas.
  for (const b of base) {
    if (!seen.has(b.field_id)) {
      seen.add(b.field_id);
      kept.push(b);
    }
  }

  // Enforce locked system fields: always enabled, mandatory, and mapped.
  // Any that were disabled in a pre-existing saved config get restored.
  const normalized = kept.map((f) =>
    LOCKED_SYSTEM_FIELD_IDS.includes(f.field_id) && f.kind === 'system'
      ? { ...f, enabled: true, mandatory: true, map_to_field: f.field_id }
      : f
  );

  // Ensure a locked field that was somehow off-canvas surfaces on the form.
  const enabled = normalized.filter((f) => f.enabled);
  const disabled = normalized.filter((f) => !f.enabled);
  return [...enabled, ...disabled];
}