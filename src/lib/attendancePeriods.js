/** Format a Date as an ISO yyyy-MM-dd string (local). */
function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const PERIOD_PRESETS = [
  { key: 'current_fy', label: 'Current Financial Year' },
  { key: 'current_cy', label: 'Current Calendar Year' },
  { key: 'last_fy', label: 'Last Financial Year' },
  { key: 'last_cy', label: 'Last Calendar Year' },
  { key: 'custom', label: 'Custom' },
];

/**
 * Resolve a preset key to { from, to } ISO date strings.
 * Australian FY runs 1 Jul – 30 Jun. Returns empty strings for custom.
 */
export function getPresetRange(key, now = new Date()) {
  const y = now.getFullYear();
  const fyStartYear = now.getMonth() >= 6 ? y : y - 1;
  switch (key) {
    case 'current_fy':
      return { from: toISODate(new Date(fyStartYear, 6, 1)), to: toISODate(new Date(fyStartYear + 1, 5, 30)) };
    case 'last_fy':
      return { from: toISODate(new Date(fyStartYear - 1, 6, 1)), to: toISODate(new Date(fyStartYear, 5, 30)) };
    case 'current_cy':
      return { from: toISODate(new Date(y, 0, 1)), to: toISODate(new Date(y, 11, 31)) };
    case 'last_cy':
      return { from: toISODate(new Date(y - 1, 0, 1)), to: toISODate(new Date(y - 1, 11, 31)) };
    case 'custom':
    default:
      return { from: '', to: '' };
  }
}