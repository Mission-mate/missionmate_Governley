import { useState, useEffect, useCallback, useRef } from 'react';
import { getAppConfig, saveAppConfig } from '@/lib/appConfig';

/**
 * Excel-style column width persistence for a single table, keyed globally
 * (not per-user) via the AppConfig entity under `column_widths:<tableKey>`.
 *
 * Returns:
 *  - widths: map of columnId -> pixel width (only resized columns appear)
 *  - setWidth(columnId, px): live update during drag (debounced persist)
 *  - getWidth(columnId, fallback): convenience reader
 */
const MIN_WIDTH = 60;

export function useColumnWidths(tableKey) {
  const [widths, setWidths] = useState({});
  const recordRef = useRef(null);
  const saveTimer = useRef(null);
  const loadedRef = useRef(false);

  const configKey = `column_widths:${tableKey}`;

  // Load persisted widths once.
  useEffect(() => {
    let active = true;
    (async () => {
      const record = await getAppConfig(configKey);
      if (!active) return;
      recordRef.current = record;
      if (record?.settings?.widths) setWidths(record.settings.widths);
      loadedRef.current = true;
    })();
    return () => { active = false; };
  }, [configKey]);

  const persist = useCallback((next) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const saved = await saveAppConfig(configKey, { widths: next }, recordRef.current);
      recordRef.current = saved;
    }, 500);
  }, [configKey]);

  const setWidth = useCallback((columnId, px) => {
    const clamped = Math.max(MIN_WIDTH, Math.round(px));
    setWidths((prev) => {
      const next = { ...prev, [columnId]: clamped };
      persist(next);
      return next;
    });
  }, [persist]);

  const getWidth = useCallback((columnId, fallback) => widths[columnId] ?? fallback, [widths]);

  return { widths, setWidth, getWidth, MIN_WIDTH };
}