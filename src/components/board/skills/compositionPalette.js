/**
 * Colours for composition donut slices and their legend swatches.
 *
 * The first six entries are the app's chart tokens (so small categories keep the
 * established look). Beyond that, colours are generated on an evenly-spaced hue
 * wheel offset past the token range, so a category with any number of options
 * never repeats a colour — previously the palette cycled after six and two
 * different options could render identically.
 */
const TOKEN_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--chart-3))',
  'hsl(216 30% 70%)',
];

export function compositionColors(count) {
  const total = Math.max(0, count);
  if (total <= TOKEN_COLORS.length) return TOKEN_COLORS.slice(0, total);

  const generatedCount = total - TOKEN_COLORS.length;
  const generated = Array.from({ length: generatedCount }, (_, i) => {
    // Spread the extras right around the wheel, starting clear of the token hues.
    const hue = Math.round((i * 360) / generatedCount + 24) % 360;
    return `hsl(${hue} 55% 50%)`;
  });
  return [...TOKEN_COLORS, ...generated];
}