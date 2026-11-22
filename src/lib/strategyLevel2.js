import { base44 } from '@/api/base44Client';

/**
 * 5 tint colour options for Level 2 labels — same palette as the register Add Column modal.
 * bg = tint circle, dot = inner dot, badge = label pill styling.
 * amber/rose retained so legacy records still render.
 */
export const LEVEL2_COLORS = {
  blue: { bg: 'bg-blue-100', dot: 'bg-blue-400', badge: 'bg-blue-100 text-blue-700' },
  green: { bg: 'bg-green-100', dot: 'bg-green-400', badge: 'bg-green-100 text-green-700' },
  orange: { bg: 'bg-orange-100', dot: 'bg-orange-400', badge: 'bg-orange-100 text-orange-700' },
  red: { bg: 'bg-red-100', dot: 'bg-red-400', badge: 'bg-red-100 text-red-700' },
  purple: { bg: 'bg-purple-100', dot: 'bg-purple-400', badge: 'bg-purple-100 text-purple-700' },
  // Legacy keys
  amber: { bg: 'bg-amber-100', dot: 'bg-amber-400', badge: 'bg-amber-100 text-amber-700' },
  rose: { bg: 'bg-rose-100', dot: 'bg-rose-400', badge: 'bg-rose-100 text-rose-700' },
};

export const LEVEL2_COLOR_KEYS = ['blue', 'green', 'orange', 'red', 'purple'];

export function listLevel2(strategyId) {
  return base44.entities.StrategyLevel2.filter({ strategy_id: strategyId }, 'order_index');
}

export function createLevel2(data) {
  return base44.entities.StrategyLevel2.create(data);
}

export function updateLevel2(id, data) {
  return base44.entities.StrategyLevel2.update(id, data);
}

export function deleteLevel2(id) {
  return base44.entities.StrategyLevel2.delete(id);
}