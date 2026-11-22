// Shared tag colour palette used across the app (Settings > Tags Management,
// Contact Database, Members, bulk edit, exports).
// Keyed by the Tag.color value.
//
// Style: soft borderless pill — light tinted background with a stronger text
// tint. Each entry also carries explicit dark-mode classes (written as literal
// strings so Tailwind's purge keeps them) and the RGB equivalents used by the
// PDF exporters.
export const TAG_COLORS = [
  {
    key: 'red',
    bg: 'bg-red-100', text: 'text-red-600',
    darkBg: 'dark:bg-red-400/15', darkText: 'dark:text-red-300',
    preview: '#fee2e2', rgb: { bg: [254, 226, 226], text: [185, 28, 28] },
  },
  {
    key: 'orange',
    bg: 'bg-orange-100', text: 'text-orange-600',
    darkBg: 'dark:bg-orange-400/15', darkText: 'dark:text-orange-300',
    preview: '#ffedd5', rgb: { bg: [255, 237, 213], text: [194, 65, 12] },
  },
  {
    key: 'yellow',
    bg: 'bg-yellow-100', text: 'text-yellow-700',
    darkBg: 'dark:bg-yellow-400/15', darkText: 'dark:text-yellow-300',
    preview: '#fef9c3', rgb: { bg: [254, 249, 195], text: [161, 98, 7] },
  },
  {
    key: 'green',
    bg: 'bg-green-100', text: 'text-green-600',
    darkBg: 'dark:bg-green-400/15', darkText: 'dark:text-green-300',
    preview: '#dcfce7', rgb: { bg: [220, 252, 231], text: [21, 128, 61] },
  },
  {
    key: 'teal',
    bg: 'bg-teal-100', text: 'text-teal-600',
    darkBg: 'dark:bg-teal-400/15', darkText: 'dark:text-teal-300',
    preview: '#ccfbf1', rgb: { bg: [204, 251, 241], text: [15, 118, 110] },
  },
  {
    key: 'blue',
    bg: 'bg-blue-100', text: 'text-blue-600',
    darkBg: 'dark:bg-blue-400/15', darkText: 'dark:text-blue-300',
    preview: '#dbeafe', rgb: { bg: [219, 234, 254], text: [29, 78, 216] },
  },
  {
    key: 'indigo',
    bg: 'bg-indigo-100', text: 'text-indigo-600',
    darkBg: 'dark:bg-indigo-400/15', darkText: 'dark:text-indigo-300',
    preview: '#e0e7ff', rgb: { bg: [224, 231, 255], text: [67, 56, 202] },
  },
  {
    key: 'purple',
    bg: 'bg-purple-100', text: 'text-purple-600',
    darkBg: 'dark:bg-purple-400/15', darkText: 'dark:text-purple-300',
    preview: '#f3e8ff', rgb: { bg: [243, 232, 255], text: [126, 34, 206] },
  },
  {
    key: 'pink',
    bg: 'bg-pink-100', text: 'text-pink-600',
    darkBg: 'dark:bg-pink-400/15', darkText: 'dark:text-pink-300',
    preview: '#fce7f3', rgb: { bg: [252, 231, 243], text: [190, 24, 93] },
  },
  {
    key: 'gray',
    bg: 'bg-gray-100', text: 'text-gray-600',
    darkBg: 'dark:bg-gray-400/15', darkText: 'dark:text-gray-300',
    preview: '#f3f4f6', rgb: { bg: [243, 244, 246], text: [55, 65, 81] },
  },
];

// Default colour applied when a Tag has no colour set. Matches TagModal's
// create-time default so new tags look the same before and after saving.
export const DEFAULT_TAG_COLOR = 'gray';

/** Resolve a colour key to its palette entry, falling back to the default. */
function findTagColor(colorKey) {
  return (
    TAG_COLORS.find((c) => c.key === colorKey) ||
    TAG_COLORS.find((c) => c.key === DEFAULT_TAG_COLOR)
  );
}

/** Borderless, fully rounded colour classes (light + dark) for a colour key. */
function getTagColorClasses(colorKey) {
  const c = findTagColor(colorKey);
  return `${c.bg} ${c.text} ${c.darkBg} ${c.darkText} border-transparent rounded-full`;
}

// Canonical tag pill geometry — every tag pill in the app uses this.
const TAG_PILL_BASE = 'inline-flex items-center text-xs font-medium px-2.5 py-0.5';

/**
 * The complete class string for a tag pill: shared geometry + the colour's
 * light and dark classes. Single source of truth for tag pill styling.
 */
export function getTagPillClasses(colorKey) {
  return `${TAG_PILL_BASE} ${getTagColorClasses(colorKey)}`;
}

/** RGB pair ({ bg, text }) for a colour key — used by the PDF exporters. */
export function getTagPdfRgb(colorKey) {
  return findTagColor(colorKey).rgb;
}