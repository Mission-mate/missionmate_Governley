// Shared Recharts entry animation for dashboard charts (bars grow, donuts sweep in).
// Matches Recharts' Pie defaults and is switched off when reduced motion is preferred.
const REDUCED_MOTION =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export const CHART_ENTRY = {
  isAnimationActive: !REDUCED_MOTION,
  animationBegin: 400,
  animationDuration: 1500,
  animationEasing: 'ease',
};

// Risk Dashboard bars and donuts share the Residual Risk Heatmap cell timing
// (400ms start delay, 500ms per-cell entry — see .heatmap-cell-enter).
export const RISK_CHART_ENTRY = { ...CHART_ENTRY, animationBegin: 400, animationDuration: 500 };