/** Health status display styling — shown as coloured text (no dot). */
export const HEALTH_OPTIONS = ['On Track', 'At Risk', 'Off Track'];

/** New items default to no health selection. */
export const DEFAULT_HEALTH = '';

export const HEALTH_STYLES = {
  'On Track': { text: 'text-green-600 dark:text-green-400' },
  'At Risk': { text: 'text-amber-600 dark:text-amber-400' },
  // Legacy value retained so existing records still render amber.
  'Monitor': { text: 'text-amber-600 dark:text-amber-400' },
  'Off Track': { text: 'text-red-600 dark:text-red-400' },
};

export function healthStyle(health) {
  return HEALTH_STYLES[health] || { text: 'text-muted-foreground' };
}