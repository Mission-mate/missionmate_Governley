// 5x5 Risk Matrix helper — maps Likelihood (1-5) x Consequence (1-5) to a rating band.

export const LIKELIHOOD_OPTIONS = [
  { value: 1, label: '1 Rare' },
  { value: 2, label: '2 Unlikely' },
  { value: 3, label: '3 Possible' },
  { value: 4, label: '4 Likely' },
  { value: 5, label: '5 Almost Certain' },
];

export const CONSEQUENCE_OPTIONS = [
  { value: 1, label: '1 Insignificant' },
  { value: 2, label: '2 Minor' },
  { value: 3, label: '3 Moderate' },
  { value: 4, label: '4 Major' },
  { value: 5, label: '5 Catastrophic' },
];

// Rating band lookup keyed by [consequence][likelihood], mirroring the heatmap image.
// Rows = consequence 1..5, Columns = likelihood 1..5.
const MATRIX = {
  5: ['Tolerable', 'High', 'Very High', 'Very High', 'Very High'],
  4: ['Low', 'Tolerable', 'High', 'Very High', 'Very High'],
  3: ['Low', 'Low', 'Tolerable', 'High', 'High'],
  2: ['Very Low', 'Low', 'Tolerable', 'Tolerable', 'High'],
  1: ['Very Low', 'Very Low', 'Low', 'Tolerable', 'Tolerable'],
};

export const RATING_STYLES = {
  'Very Low': { bg: 'bg-lime-500', text: 'text-white' },
  'Low': { bg: 'bg-green-600', text: 'text-white' },
  'Tolerable': { bg: 'bg-yellow-400', text: 'text-yellow-950' },
  'High': { bg: 'bg-orange-500', text: 'text-white' },
  'Very High': { bg: 'bg-red-600', text: 'text-white' },
};

/** Dot tones for levels 1-5, following the matrix palette (Very Low → Very High). */
export const LEVEL_TONES = {
  1: { dot: 'bg-lime-500' },
  2: { dot: 'bg-green-600' },
  3: { dot: 'bg-yellow-400' },
  4: { dot: 'bg-orange-500' },
  5: { dot: 'bg-red-600' },
};

/** Number-free label for a stored level, e.g. 2 → "Minor" (value still drives scoring). */
export function levelName(options, value) {
  const opt = options.find((o) => o.value === Number(value));
  return opt ? opt.label.replace(/^\d+\s*/, '') : '';
}

/** Returns the rating band label for a likelihood/consequence pair, or null. */
export function getRiskRating(likelihood, consequence) {
  const l = Number(likelihood);
  const c = Number(consequence);
  if (!l || !c || !MATRIX[c]) return null;
  return MATRIX[c][l - 1] || null;
}

/** Numeric score (likelihood * consequence), or null. */
export function getRiskScore(likelihood, consequence) {
  const l = Number(likelihood);
  const c = Number(consequence);
  if (!l || !c) return null;
  return l * c;
}