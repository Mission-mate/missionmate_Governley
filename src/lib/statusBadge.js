/**
 * Shared badge tones for status / priority / state pills.
 *
 * Single source of truth so every module's pills carry the same muted dark-mode
 * treatment: a desaturated translucent fill with a light readable text colour,
 * instead of a bright pastel that glows against dark surfaces.
 *
 * Usage:  <span className={`rounded-full px-2.5 py-0.5 text-xs ${badgeTone('green')}`}>
 */
const TONES = {
  green:  'bg-green-50 text-green-700 border-green-200 dark:bg-green-400/15 dark:text-green-300 dark:border-green-400/25',
  blue:   'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-400/15 dark:text-blue-300 dark:border-blue-400/25',
  amber:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-400/15 dark:text-amber-300 dark:border-amber-400/25',
  orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-400/15 dark:text-orange-300 dark:border-orange-400/25',
  red:    'bg-red-50 text-red-700 border-red-200 dark:bg-red-400/15 dark:text-red-300 dark:border-red-400/25',
  purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-400/15 dark:text-purple-300 dark:border-purple-400/25',
  teal:   'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-400/15 dark:text-teal-300 dark:border-teal-400/25',
  slate:  'bg-muted text-muted-foreground border-border',
};

/** Classes for a badge tone. Falls back to the neutral slate tone. */
export function badgeTone(tone) {
  return TONES[tone] || TONES.slate;
}


export default TONES;