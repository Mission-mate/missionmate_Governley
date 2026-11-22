/**
 * Shared "corner glow + gradient number" summary-card styling.
 *
 * Single source of truth so every module's summary cards look identical and
 * adapt to dark mode. The gradient is built from two CSS variables defined in
 * src/index.css:
 *   --glow-base          the card surface (near-white in light, dark card in dark)
 *   --glow-tint-strength how strongly the tone tint mixes into the corner glow
 *
 * Because the theme lives in CSS variables, light mode is untouched and dark
 * mode automatically renders a dark surface with a subtle coloured corner glow.
 */

/** Background for a glow card, given a tone tint colour. */
export function glowBackground(tint) {
  return `radial-gradient(120% 120% at 100% 100%, color-mix(in oklab, ${tint} var(--glow-tint-strength), var(--glow-base)) 0%, var(--glow-base) 60%)`;
}

/** Card shell class — applies the theme-aware elevation. */
export const GLOW_CARD = 'glow-card';

/**
 * Label / sublabel class. Tone label colours are authored for light mode; in
 * dark mode this class overrides them with a readable muted foreground.
 */
export const GLOW_LABEL = 'glow-label';

/** Gradient number class — brightens the gradient in dark mode so it stays vivid. */
export const GLOW_VALUE = 'glow-value';