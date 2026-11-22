/**
 * Single source of truth for the Team Management access-permission tree.
 *
 * To expose a new module or submodule in Team Management permissions, just add it here —
 * the permissions UI renders this config dynamically, so no component changes
 * are needed.
 *
 * 'My Profile' is intentionally omitted: it is always available to every user
 * and is not toggleable.
 */
export const PERMISSION_CONFIG = [
  { id: 'contacts', label: 'Contacts' },
  { id: 'grant_management', label: 'Grant Management' },
  { id: 'program_management', label: 'Program Management' },
  {
    id: 'board_management',
    label: 'Board Management',
    children: [
      { id: 'meetings', label: 'Meetings' },
      { id: 'actions', label: 'Actions' },
      { id: 'decisions', label: 'Decisions' },
      { id: 'documents', label: 'Documents' },
      { id: 'people', label: 'People' },
      { id: 'committees', label: 'Committees' },
    ],
  },
  { id: 'membership_management', label: 'Membership Management' },
  { id: 'strategy_management', label: 'Strategy Management' },
  { id: 'risk_management', label: 'Risk Management' },
  { id: 'compliance_management', label: 'Compliance Management' },
  { id: 'policy_management', label: 'Policy Management' },
  {
    id: 'settings',
    label: 'Settings',
    children: [
      { id: 'org_profile', label: 'Organisation Profile' },
      { id: 'team_management', label: 'Team Management' },
      { id: 'customisation', label: 'Customisation' },
      { id: 'custom_fields', label: 'Custom Fields' },
      { id: 'tags', label: 'Tags' },
      { id: 'integrations', label: 'Integrations' },
    ],
  },
];

/** Always-available items shown as a note in the permissions UI. */
export const ALWAYS_AVAILABLE = ['My Profile'];

/** Build the flat list of every permission key, e.g. 'board_management', 'board_management.meetings'. */
export function allPermissionKeys() {
  const keys = [];
  for (const mod of PERMISSION_CONFIG) {
    keys.push(mod.id);
    for (const child of mod.children || []) {
      keys.push(`${mod.id}.${child.id}`);
    }
  }
  return keys;
}

/** A permissions map with every key set to the given value. */
export function buildPermissionsMap(value) {
  return allPermissionKeys().reduce((acc, key) => {
    acc[key] = value;
    return acc;
  }, {});
}