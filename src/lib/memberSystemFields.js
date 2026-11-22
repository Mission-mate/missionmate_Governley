import { useQuery } from '@tanstack/react-query';
import { getAppConfig, saveAppConfig } from '@/lib/appConfig';

const CONFIG_KEY = 'membership_system_fields';

/**
 * The canonical, ordered list of member system fields shown in the
 * Contact Details container and the Configuration → System Fields table.
 *
 * - key:        Member entity attribute
 * - label:      Display label
 * - type:       Field type label (for the config table)
 * - inputType:  HTML input type used in edit mode
 * - canHide:    Whether the admin may toggle its visibility (eye icon enabled)
 */
export const MEMBER_SYSTEM_FIELDS = [
  { key: 'first_name', label: 'First Name', type: 'Text', inputType: 'text', canHide: false, hiddenInTable: true },
  { key: 'last_name', label: 'Last Name', type: 'Text', inputType: 'text', canHide: false, hiddenInTable: true },
  { key: 'email', label: 'Email', type: 'Text', inputType: 'email', canHide: false, hiddenInTable: true },
  { key: 'phone', label: 'Contact Number', type: 'Phone', inputType: 'text', canHide: false, hiddenInTable: true },
  { key: 'street_address', label: 'Street Address', type: 'Text', inputType: 'text', canHide: true },
  { key: 'suburb', label: 'Suburb', type: 'Text', inputType: 'text', canHide: true },
  { key: 'state', label: 'State', type: 'Text', inputType: 'text', canHide: true },
  { key: 'postal_code', label: 'Postal Code', type: 'Number', inputType: 'text', canHide: true },
];

/**
 * System-locked fields that render inside the member's Additional Details
 * section alongside user-created custom fields. They are hardcoded (never
 * stored in AppConfig) so admins can't edit or delete them, and their values
 * live on the real Member entity attributes, not the custom_fields map.
 */
export const MEMBERSHIP_SYSTEM_CUSTOM_FIELDS = [
  { id: 'organisation', name: 'Organisation', type: 'Text' },
];

/**
 * Returns the visibility map (key -> boolean). Fields default to visible.
 */
function resolveVisibility(map = {}) {
  const out = {};
  for (const f of MEMBER_SYSTEM_FIELDS) {
    out[f.key] = f.canHide ? map[f.key] !== false : true;
  }
  return out;
}

/**
 * React Query hook returning the system field visibility map plus a setter.
 */
export function useSystemFieldVisibility() {
  const query = useQuery({
    queryKey: ['membership_system_fields'],
    queryFn: () => getAppConfig(CONFIG_KEY),
  });

  const record = query.data ?? null;
  const visibility = resolveVisibility(record?.settings?.system_field_visibility);

  const setVisibility = async (key, visible) => {
    const nextMap = {
      ...(record?.settings?.system_field_visibility || {}),
      [key]: visible,
    };
    await saveAppConfig(CONFIG_KEY, { system_field_visibility: nextMap }, record);
    await query.refetch();
  };

  return { visibility, setVisibility, isLoading: query.isLoading };
}