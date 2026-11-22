import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAppConfig, saveAppConfig } from '@/lib/appConfig';

const KEY = 'attendance_thresholds';
export const DEFAULT_THRESHOLDS = { good: 75, atRisk: 50 };

/**
 * Reads/writes the customizable attendance thresholds (Good / At Risk)
 * from the global AppConfig record.
 */
export function useAttendanceThresholds() {
  const queryClient = useQueryClient();

  const { data: record } = useQuery({
    queryKey: [KEY],
    queryFn: () => getAppConfig(KEY),
  });

  const thresholds = {
    good: record?.settings?.good ?? DEFAULT_THRESHOLDS.good,
    atRisk: record?.settings?.atRisk ?? DEFAULT_THRESHOLDS.atRisk,
  };

  const mutation = useMutation({
    mutationFn: (next) => saveAppConfig(KEY, { ...thresholds, ...next }, record),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [KEY] }),
  });

  return { thresholds, saveThresholds: mutation.mutateAsync, isSaving: mutation.isPending };
}