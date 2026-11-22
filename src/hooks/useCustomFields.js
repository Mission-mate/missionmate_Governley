import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getCustomFieldsRecord,
  getFieldsFromRecord,
} from '@/lib/customFields';

/**
 * Reads custom field definitions for an object (e.g. 'contacts').
 * Returns the ordered list of fields, the underlying AppConfig record,
 * loading state, and a refresh helper.
 */
export function useCustomFields(objectId) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['custom_fields_config'],
    queryFn: getCustomFieldsRecord,
  });

  return {
    fields: getFieldsFromRecord(data, objectId),
    record: data ?? null,
    isLoading,
    refresh: () => qc.invalidateQueries({ queryKey: ['custom_fields_config'] }),
  };
}