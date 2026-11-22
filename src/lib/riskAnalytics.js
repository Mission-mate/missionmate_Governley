import { getRiskScore } from '@/lib/riskMatrix';

const RATING_ORDER = ['Very Low', 'Low', 'Tolerable', 'High', 'Very High'];

export const RATING_COLORS = {
  'Very Low': '#84cc16',
  'Low': '#16a34a',
  'Tolerable': '#facc15',
  'High': '#f97316',
  'Very High': '#dc2626',
};

const CATEGORY_PALETTE = ['#2563eb', '#16a34a', '#f97316', '#a855f7', '#dc2626', '#0891b2', '#db2777', '#65a30d'];

/** Inherent / residual numeric score for a risk (likelihood * consequence). */
function inherentScore(r) {
  return getRiskScore(r.inherent_likelihood, r.inherent_consequence) || 0;
}
function residualScore(r) {
  return getRiskScore(r.residual_likelihood, r.residual_consequence) || 0;
}

/**
 * Average inherent & residual risk scores, normalised to a 0-100 scale.
 * Raw scores are 1-25 (5x5 matrix), so the average is multiplied by 4.
 * Only risks with a score are counted, so the index stays comparable as the register grows.
 */
export function totalScores(risks = []) {
  const sums = risks.reduce(
    (acc, r) => {
      const i = inherentScore(r);
      const res = residualScore(r);
      if (i) { acc.inherent += i; acc.inherentCount += 1; }
      if (res) { acc.residual += res; acc.residualCount += 1; }
      return acc;
    },
    { inherent: 0, residual: 0, inherentCount: 0, residualCount: 0 }
  );

  return {
    inherent: sums.inherentCount ? Math.round((sums.inherent / sums.inherentCount) * 4) : 0,
    residual: sums.residualCount ? Math.round((sums.residual / sums.residualCount) * 4) : 0,
  };
}

/** Risks whose residual score meets/exceeds the organisational appetite threshold. */
export function risksOutsideAppetite(risks = [], threshold = 0) {
  return risks.filter((r) => residualScore(r) >= threshold);
}

/** Residual rating distribution for the pie chart. */
export function ratingDistribution(risks = []) {
  const counts = {};
  risks.forEach((r) => {
    const rating = r.residual_rating || r.inherent_rating;
    if (!rating) return;
    counts[rating] = (counts[rating] || 0) + 1;
  });
  return RATING_ORDER.filter((rt) => counts[rt]).map((rt) => ({
    name: rt,
    value: counts[rt],
    color: RATING_COLORS[rt] || '#94a3b8',
  }));
}

/** Inherent vs residual score grouped by risk category, for the bar chart. */
export function scoresByCategory(risks = []) {
  const map = {};
  risks.forEach((r) => {
    const cat = r.category || 'Uncategorised';
    if (!map[cat]) map[cat] = { category: cat, inherent: 0, residual: 0, count: 0 };
    map[cat].inherent += inherentScore(r);
    map[cat].residual += residualScore(r);
    map[cat].count += 1;
  });
  return Object.values(map).sort((a, b) => b.inherent - a.inherent);
}

/** Top N risks by residual score (highest first), for the Top Risks chart. */
export function topRisks(risks = [], limit = 5) {
  return [...risks]
    .map((r) => ({
      id: r.id,
      title: r.title || 'Untitled risk',
      score: residualScore(r),
      rating: r.residual_rating || r.inherent_rating,
    }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Risk count by category for an optional category pie. */
export function categoryDistribution(risks = []) {
  const map = {};
  risks.forEach((r) => {
    const cat = r.category || 'Uncategorised';
    map[cat] = (map[cat] || 0) + 1;
  });
  return Object.keys(map).map((cat, i) => ({
    name: cat,
    value: map[cat],
    color: CATEGORY_PALETTE[i % CATEGORY_PALETTE.length],
  }));
}