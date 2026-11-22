import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const CONFIG_KEY = 'org_profile';

/**
 * Reads the organisation profile (name + logo) from AppConfig so branding
 * stays in sync across the app wherever it's displayed.
 */
export function useOrgProfile() {
  const { data, isLoading } = useQuery({
    queryKey: ['orgProfile'],
    queryFn: async () => {
      const records = await base44.entities.AppConfig.filter({ key: CONFIG_KEY });
      return records[0]?.settings ?? {};
    },
  });

  const settings = data ?? {};
  return {
    name: (settings.name || '').trim(),
    logoUrl: settings.logo_url || '',
    isLoading,
  };
}