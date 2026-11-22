/**
 * Custom field definitions for objects (currently Contacts).
 *
 * ARCHITECTURE:
 *  - Definitions are stored in a single AppConfig record (key = 'custom_fields'),
 *    keyed by objectId:  { settings: { contacts: [ {field}, ... ] } }
 *  - Values are stored on each entity record's `custom_fields` JSON map,
 *    keyed by the field's `id`:  contact.custom_fields[fieldId] = value
 *
 * This keeps definition/value concerns separate and avoids schema churn.
 */
import { base44 } from '@/api/base44Client';

const CUSTOM_FIELDS_CONFIG_KEY = 'custom_fields';

// Locked context for any field created inside an object's configuration.
export const LOCKED_OBJECT_LABEL = 'Contacts';
export const LOCKED_SECTION_LABEL = 'Additional Details';

// Locked "Add to object" label shown per object in the custom field editor.
// Each object's custom fields are written to that entity's `custom_fields` map.
const OBJECT_LABELS = {
  contacts: 'Contacts',
  membership: 'Membership',
  volunteers: 'Volunteers',
};

// Placeholder examples for the Field name input, per field type.
const FIELD_NAME_PLACEHOLDERS = {
  'Text': 'e.g. Name, Title',
  'Number': 'e.g. Amount, Phone Number',
  'Date': 'e.g. Start Date',
  'Dropdown (Single Select)': 'e.g. Status, Priority',
  'Dropdown (Multi-Select)': 'e.g. Status, Priority',
  'Long Text': 'e.g. Description, Notes',
  'Radio Button': 'e.g. Payment Methods',
  'Checkbox': 'e.g. Colour Preference',
  'File Upload': 'e.g. Evidence, Photo ID',
};
export const getFieldNamePlaceholder = (type) => FIELD_NAME_PLACEHOLDERS[type] || 'e.g. Annual Budget';
export const getObjectLabel = (objectId) => OBJECT_LABELS[objectId] || LOCKED_OBJECT_LABEL;

/**
 * All supported field types with metadata describing how they behave and render.
 *  - hasOptions: shows the option editor (dropdowns / radio / checkbox)
 *  - multi: stores an array of values
 */
export const FIELD_TYPES = [
  { value: 'Text', label: 'Text', hasOptions: false, multi: false },
  { value: 'Number', label: 'Number', hasOptions: false, multi: false },
  { value: 'Date', label: 'Date', hasOptions: false, multi: false },
  { value: 'Dropdown (Single Select)', label: 'Dropdown (Single Select)', hasOptions: true, multi: false },
  { value: 'Dropdown (Multi-Select)', label: 'Dropdown (Multi-Select)', hasOptions: true, multi: true },
  { value: 'Long Text', label: 'Long Text', hasOptions: false, multi: false },
  { value: 'Radio Button', label: 'Radio Button', hasOptions: true, multi: false },
  { value: 'Checkbox', label: 'Checkbox', hasOptions: true, multi: true },
  { value: 'File Upload', label: 'File Upload', hasOptions: false, multi: false },
];

function getFieldTypeMeta(type) {
  return FIELD_TYPES.find((t) => t.value === type) || FIELD_TYPES[0];
}

export const fieldHasOptions = (type) => getFieldTypeMeta(type).hasOptions;
export const fieldIsMulti = (type) => getFieldTypeMeta(type).multi;

export const slugify = (s) =>
  (s || '').toString().toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

/** Fetch the AppConfig record that holds all custom field definitions. */
export async function getCustomFieldsRecord() {
  const records = await base44.entities.AppConfig.filter({ key: CUSTOM_FIELDS_CONFIG_KEY });
  return records[0] ?? null;
}

/** Get the list of custom field definitions for a given object. */
export function getFieldsFromRecord(record, objectId) {
  return record?.settings?.[objectId] ?? [];
}

/** Persist the full list of fields for an object back to the AppConfig record. */
export async function saveCustomFields(record, objectId, fields) {
  const nextSettings = { ...(record?.settings ?? {}), [objectId]: fields };
  if (record?.id) {
    return base44.entities.AppConfig.update(record.id, { settings: nextSettings });
  }
  return base44.entities.AppConfig.create({ key: CUSTOM_FIELDS_CONFIG_KEY, settings: nextSettings });
}