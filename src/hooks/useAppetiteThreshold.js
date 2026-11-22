import { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';

const CONFIG_KEY = 'risk_appetite_threshold';
export const DEFAULT_THRESHOLD = 8;

/**
 * Shared organisational risk appetite threshold (0-25), persisted to AppConfig.
 * Lifted out of RiskAppetitePanel so the summary cards react to the same value.
 */
export default function useAppetiteThreshold() {
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [configRecord, setConfigRecord] = useState(null);

  useEffect(() => {
    (async () => {
      const records = await base44.entities.AppConfig.filter({ key: CONFIG_KEY });
      const rec = records[0];
      if (rec) {
        setConfigRecord(rec);
        if (typeof rec.settings?.threshold === 'number') setThreshold(rec.settings.threshold);
      }
    })();
  }, []);

  const persist = useCallback(
    async (value) => {
      const settings = { threshold: value };
      if (configRecord?.id) {
        const rec = await base44.entities.AppConfig.update(configRecord.id, { settings });
        setConfigRecord(rec ?? { ...configRecord, settings });
      } else {
        const rec = await base44.entities.AppConfig.create({ key: CONFIG_KEY, settings });
        setConfigRecord(rec);
      }
    },
    [configRecord]
  );

  return { threshold, setThreshold, persist };
}