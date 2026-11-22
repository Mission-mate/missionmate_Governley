import { getLayerByLevel, MODULES } from '@/lib/strategyLayers';

/**
 * Where "open this record" lands. Projects/Programs and Measures (the measures
 * module) open their full record page; every other layer opens its row's pane
 * in the strategy register tab.
 */
export function blockOpenPath(strategy, block) {
  if (getLayerByLevel(strategy, block.level)?.module === MODULES.MEASURES) {
    return `/strategy/deliverables/${block.id}`;
  }
  return `/strategy/register/${strategy.id}?tab=level${block.level}&block=${block.id}`;
}