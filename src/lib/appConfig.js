import { base44 } from '@/api/base44Client';

/**
 * Generic helpers for reading/writing a single global AppConfig record
 * identified by `key`. The config payload lives under `record.settings`.
 */
export async function getAppConfig(key) {
  const records = await base44.entities.AppConfig.filter({ key });
  return records[0] ?? null;
}

export async function saveAppConfig(key, settings, existingRecord) {
  if (existingRecord?.id) {
    return base44.entities.AppConfig.update(existingRecord.id, { settings });
  }
  return base44.entities.AppConfig.create({ key, settings });
}