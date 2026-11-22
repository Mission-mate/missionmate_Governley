import { base44 } from '@/api/base44Client';

/**
 * The "Contact Type" custom field is a locked-in field for the Contacts module.
 * It is stored as a single AppConfig record. Field Name, Object, and Section are
 * locked; only Field Type (single/multi select), Description, and Options are editable.
 */
const CONTACT_TYPE_CONFIG_KEY = 'contact_type_field';

export const CONTACT_TYPE_FIELD_ID = 'contact_type';
export const CONTACT_TYPE_FIELD_NAME = 'Contact Type';
export const CONTACT_TYPE_SECTION = 'Additional Information';

export const CONTACT_TYPE_FIELD_TYPES = [
  'Dropdown (Single Select)',
  'Dropdown (Multi-Select)',
];

const DEFAULT_OPTIONS = [
  'Individual', 'Organisation', 'Member', 'Board Member', 'Volunteer',
  'Staff', 'Partner', 'Supplier', 'Funder',
].map((label) => ({ label, value: label.toLowerCase().replace(/\s+/g, '_') }));

export const DEFAULT_CONTACT_TYPE_CONFIG = {
  fieldType: 'Dropdown (Single Select)',
  description: '',
  required: true,
  options: DEFAULT_OPTIONS,
};

/**
 * Canonical class string for a Contact Type badge — borderless blue pill with a
 * dark-mode variant. Single source of truth for every Contact Type badge in the app.
 */
export const CONTACT_TYPE_BADGE_CLASSES =
  'text-xs font-medium px-3 py-0.5 rounded-full border-transparent bg-blue-100 text-blue-600 dark:bg-blue-400/15 dark:text-blue-300';

export function isMultiSelect(config) {
  return config?.fieldType === 'Dropdown (Multi-Select)';
}

/** Fetch (or lazily create) the Contact Type config record. */
export async function getContactTypeConfig() {
  const records = await base44.entities.AppConfig.filter({ key: CONTACT_TYPE_CONFIG_KEY });
  if (records[0]) {
    return { record: records[0], config: { ...DEFAULT_CONTACT_TYPE_CONFIG, ...records[0].settings } };
  }
  return { record: null, config: DEFAULT_CONTACT_TYPE_CONFIG };
}

export async function saveContactTypeConfig(config, existingRecord) {
  if (existingRecord?.id) {
    return base44.entities.AppConfig.update(existingRecord.id, { settings: config });
  }
  return base44.entities.AppConfig.create({ key: CONTACT_TYPE_CONFIG_KEY, settings: config });
}