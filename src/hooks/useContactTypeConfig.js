import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getContactTypeConfig,
  DEFAULT_CONTACT_TYPE_CONFIG,
} from '@/lib/contactTypeConfig';

/**
 * Reads the locked "Contact Type" custom field configuration.
 * Returns the config (fieldType, options, etc.), the underlying AppConfig record,
 * and a refresh helper.
 */
export function useContactTypeConfig() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['contact_type_config'],
    queryFn: getContactTypeConfig,
  });

  return {
    config: data?.config ?? DEFAULT_CONTACT_TYPE_CONFIG,
    record: data?.record ?? null,
    isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: ['contact_type_config'] }),
  };
}