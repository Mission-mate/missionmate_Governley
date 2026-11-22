/** Per-deliverable (Level 6) tracking & monitoring configuration helpers. */

import { LEVELS } from '@/lib/strategyLayers';

export const TRACKING_METHODS = [
  { id: 'completion', title: 'Milestones', guide: 'Track progress through tasks and subtasks completion.' },
  { id: 'count', title: 'Data Reporting', guide: 'Track performance using numbers over periods.' },
  { id: 'both', title: 'Both', guide: 'Track both task completion and numbers.' },
];

export const UNIT_OPTIONS = ['#', '%', '$'];

/** Display labels for unit values (stored values stay as the symbol). */
export const UNIT_LABELS = { '#': '# Number', '%': '% Percentage', '$': '$ Currency' };
export const unitLabel = (u) => UNIT_LABELS[u] || u || '';

/** Reporting frequency options (mirrors the Add Measure modal). */
export const FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Biannually', 'Annually', 'Every', 'Ad Hoc'];

/** Units available for the custom 'Every' reporting interval. */
export const INTERVAL_UNITS = ['Months', 'Years'];

/** Whether a higher or lower reported value is the desired outcome. */
export const DIRECTION_OPTIONS = ['Higher is Better', 'Lower is Better'];

/** Strategic Initiatives (Projects) always track through Tasks & Milestones only. */
export const isInitiative = (level) => Number(level) === LEVELS.INITIATIVES;

/** Measures always track through Data Reporting only. */
export const isMeasure = (level) => Number(level) === LEVELS.MEASURES;

/**
 * Levels with a fixed tracking method — the Track Progress toggle alone decides
 * which tabs appear, so no method selector is shown.
 */
export const autoMethod = (level) =>
  isInitiative(level) ? 'completion' : isMeasure(level) ? 'count' : '';

export function normalizeTracking(tc, level) {
  const src = tc && typeof tc === 'object' ? tc : {};
  const enabled = !!src.enabled;
  const auto = autoMethod(level);
  const direction = DIRECTION_OPTIONS.includes(src.direction) ? src.direction : '';
  if (auto) {
    return {
      enabled,
      method: enabled ? auto : '',
      unit: UNIT_OPTIONS.includes(src.unit) ? src.unit : '#',
      direction,
    };
  }
  return {
    enabled,
    method: ['completion', 'count', 'both'].includes(src.method) ? src.method : '',
    unit: UNIT_OPTIONS.includes(src.unit) ? src.unit : '#',
    direction,
  };
}

/** True when the block tracks numeric counts (count or both). */
export const tracksCount = (tc, level) => {
  const t = normalizeTracking(tc, level);
  return t.enabled && (t.method === 'count' || t.method === 'both');
};

/** True when the block tracks task completion (completion or both). */
export const tracksCompletion = (tc, level) => {
  const t = normalizeTracking(tc, level);
  return t.enabled && (t.method === 'completion' || t.method === 'both');
};

/** Formats a numeric value with the configured unit. */
export function formatUnitValue(value, unit) {
  if (value === null || value === undefined || value === '') return '—';
  if (unit === '$') return `$${value}`;
  if (unit === '%') return `${value}%`;
  return String(value);
}