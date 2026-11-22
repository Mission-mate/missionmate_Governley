import React from 'react';
import { Compass, Layers, Target, Rocket, Navigation, Activity, Cpu, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LEVELS } from '@/lib/strategyLayers';

/** Coloured circular icon for each hierarchy layer, keyed by the layer's storage slot. */
const LEVEL_ICONS = {
  [LEVELS.VISION]: { Icon: Compass, bg: 'bg-gradient-to-br from-purple-500 to-violet-600' },
  [LEVELS.THEME]: { Icon: Layers, bg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  [LEVELS.PRIORITIES]: { Icon: Target, bg: 'bg-gradient-to-br from-emerald-500 to-green-600' },
  [LEVELS.ACTIONS]: { Icon: Navigation, bg: 'bg-gradient-to-br from-blue-500 to-blue-600' },
  [LEVELS.INITIATIVES]: { Icon: Rocket, bg: 'bg-gradient-to-br from-pink-500 to-rose-500' },
  [LEVELS.MEASURES]: { Icon: Activity, bg: 'bg-gradient-to-br from-orange-500 to-amber-500' },
  [LEVELS.ENABLERS]: { Icon: Cpu, bg: 'bg-gradient-to-br from-teal-500 to-cyan-600' },
  [LEVELS.CUSTOM]: { Icon: Sparkles, bg: 'bg-gradient-to-br from-purple-500 to-violet-600' },
};

export default function LevelIcon({ level, size = 'md', className }) {
  const cfg = LEVEL_ICONS[level] || LEVEL_ICONS[LEVELS.PRIORITIES];
  // 'reg' = register tables: 5% smaller than the default md (32px -> ~30.4px)
  const dim = size === 'sm' ? 'w-6 h-6' : size === 'reg' ? 'w-[30px] h-[30px]' : 'w-8 h-8';
  const ic = size === 'sm' ? 'w-3.5 h-3.5' : size === 'reg' ? 'w-[15px] h-[15px]' : 'w-4 h-4';
  return (
    <span className={cn('inline-flex items-center justify-center rounded-full text-white shrink-0 shadow-md ring-1 ring-black/5', dim, cfg.bg, className)}>
      <cfg.Icon className={ic} strokeWidth={2.2} />
    </span>
  );
}