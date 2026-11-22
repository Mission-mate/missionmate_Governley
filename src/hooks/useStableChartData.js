import { useRef } from 'react';

/**
 * Returns the same array reference for as long as its contents are unchanged.
 *
 * Recharts restarts a chart's animation from its current (already drawn) shape
 * whenever it receives a new `data` reference. Dashboards rebuild their chart
 * arrays on every render and on every background refetch, which cut the entry
 * sweep short on revisits. Holding the reference steady lets the entry animation
 * play in full each time the chart mounts, while real data changes still update.
 */
export default function useStableChartData(data) {
  const ref = useRef({ key: null, data });
  const key = JSON.stringify(data ?? []);
  if (ref.current.key !== key) ref.current = { key, data };
  return ref.current.data;
}