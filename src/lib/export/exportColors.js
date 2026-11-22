// Resolves the Tailwind badge classes used across the registers into RGB values,
// so PDF / Excel exports can reproduce the exact colours shown in the table UI.

const PALETTE = {
  white: { 0: [255, 255, 255] },
  slate: { 100: [241, 245, 249], 400: [148, 163, 184], 500: [100, 116, 139], 600: [71, 85, 105], 700: [51, 65, 85] },
  gray: { 100: [243, 244, 246], 400: [156, 163, 175], 500: [107, 114, 128], 600: [75, 85, 99], 700: [55, 65, 81] },
  red: { 100: [254, 226, 226], 400: [248, 113, 113], 500: [239, 68, 68], 600: [220, 38, 38], 700: [185, 28, 28] },
  rose: { 100: [255, 228, 230], 400: [251, 113, 133], 500: [244, 63, 94], 600: [225, 29, 72], 700: [190, 18, 60] },
  orange: { 100: [255, 237, 213], 400: [251, 146, 60], 500: [249, 115, 22], 600: [234, 88, 12], 700: [194, 65, 12] },
  amber: { 100: [254, 243, 199], 400: [251, 191, 36], 500: [245, 158, 11], 600: [217, 119, 6], 700: [180, 83, 9] },
  yellow: { 100: [254, 249, 195], 400: [250, 204, 21], 500: [234, 179, 8], 600: [202, 138, 4], 700: [161, 98, 7], 950: [66, 32, 6] },
  lime: { 100: [236, 252, 203], 400: [163, 230, 53], 500: [132, 204, 22], 600: [101, 163, 13], 700: [77, 124, 15] },
  green: { 100: [220, 252, 231], 400: [74, 222, 128], 500: [34, 197, 94], 600: [22, 163, 74], 700: [21, 128, 61] },
  emerald: { 100: [209, 250, 229], 400: [52, 211, 153], 500: [16, 185, 129], 600: [5, 150, 105], 700: [4, 120, 87] },
  teal: { 100: [204, 251, 241], 400: [45, 212, 191], 500: [20, 184, 166], 600: [13, 148, 136], 700: [15, 118, 110] },
  blue: { 100: [219, 234, 254], 400: [96, 165, 250], 500: [59, 130, 246], 600: [37, 99, 235], 700: [29, 78, 216] },
  indigo: { 100: [224, 231, 255], 400: [129, 140, 248], 500: [99, 102, 241], 600: [79, 70, 229], 700: [67, 56, 202] },
  violet: { 100: [237, 233, 254], 400: [167, 139, 250], 500: [139, 92, 246], 600: [124, 58, 237], 700: [109, 40, 217] },
  purple: { 100: [243, 232, 255], 400: [192, 132, 252], 500: [168, 85, 247], 600: [147, 51, 234], 700: [126, 34, 206] },
};

const MUTED_BG = [243, 244, 246];
const MUTED_FG = [107, 114, 128];
const FOREGROUND = [30, 35, 45];

function lookup(token) {
  if (!token) return null;
  if (token === 'white') return PALETTE.white[0];
  if (token === 'muted') return MUTED_BG;
  if (token === 'muted-foreground') return MUTED_FG;
  if (token === 'foreground') return FOREGROUND;
  const [family, shade] = token.split('-');
  return PALETTE[family]?.[Number(shade)] || null;
}

/**
 * Parse a Tailwind class string like "bg-rose-100 text-rose-700" into
 * { bg, fg } RGB triples. Falls back to the muted badge palette.
 */
export function badgeColors(classes = '') {
  let bg = MUTED_BG;
  let fg = MUTED_FG;
  String(classes).split(/\s+/).forEach((cls) => {
    if (cls.startsWith('bg-')) bg = lookup(cls.slice(3)) || bg;
    else if (cls.startsWith('text-')) fg = lookup(cls.slice(5)) || fg;
  });
  return { bg, fg };
}

/** Hex string (no #) of the text colour in a Tailwind class string — used for Excel fonts. */
export function textHex(classes = '') {
  const { bg, fg } = badgeColors(classes);
  // White badge text is unreadable in Excel (no fill), so fall back to the fill colour.
  const rgb = fg[0] > 240 && fg[1] > 240 && fg[2] > 240 ? bg : fg;
  return rgb.map((n) => n.toString(16).padStart(2, '0')).join('');
}

export const RGB = { muted: MUTED_FG, foreground: FOREGROUND, destructive: [185, 28, 28] };