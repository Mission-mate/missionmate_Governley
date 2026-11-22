import React from 'react';
import { getEnabledLayers } from '@/lib/strategyLayers';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

/** Static styling per layer key — renames never affect card colours. */
const CARD_STYLES = {
  priorities: { tint: 'oklch(0.94 0.05 150)', dark: 'oklch(0.35 0.1 150)', light: 'oklch(0.55 0.12 150)' },
  actions: { tint: 'oklch(0.94 0.05 260)', dark: 'oklch(0.35 0.1 260)', light: 'oklch(0.55 0.12 260)' },
  initiatives: { tint: 'oklch(0.93 0.06 0)', dark: 'oklch(0.35 0.1 0)', light: 'oklch(0.55 0.13 0)' },
  measures: { tint: 'oklch(0.94 0.06 55)', dark: 'oklch(0.38 0.09 55)', light: 'oklch(0.58 0.12 55)' },
  enablers: { tint: 'oklch(0.93 0.05 195)', dark: 'oklch(0.35 0.09 195)', light: 'oklch(0.52 0.11 195)' },
  custom: { tint: 'oklch(0.93 0.055 300)', dark: 'oklch(0.35 0.1 300)', light: 'oklch(0.55 0.13 300)' },
};

const isAtRisk = (h) => h === 'At Risk' || h === 'Monitor';

/** Per-level summary cards for the Overview tab — synced with the customizer layers. */
export default function OverviewLevelSummaryCards({ strategy, blocks }) {
  const layers = getEnabledLayers(strategy).filter((l) => CARD_STYLES[l.key]);
  if (layers.length === 0) return null;

  return (
    <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16 }}>
      {layers.map((layer) => {
        const s = CARD_STYLES[layer.key];
        const items = blocks.filter((b) => b.level === layer.level);
        const onTrack = items.filter((b) => b.health === 'On Track').length;
        const atRisk = items.filter((b) => isAtRisk(b.health)).length;
        const offTrack = items.filter((b) => b.health === 'Off Track').length;
        return (
          <div
            key={layer.key}
            className={GLOW_CARD}
            style={{ borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 6, background: glowBackground(s.tint) }}
          >
            <span className={GLOW_LABEL} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: s.dark }}>
              {layer.name}
            </span>
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={GLOW_VALUE}
                style={{ display: 'block', fontSize: 40, letterSpacing: '-0.02em', fontWeight: 800, lineHeight: 1, background: `linear-gradient(135deg, ${s.dark}, ${s.light})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                {items.length}
              </span>
              <div className="flex flex-col text-[10.8px] leading-[1.2] font-medium whitespace-nowrap min-w-0">
                <span className="text-green-700 dark:text-green-400">On Track {onTrack}</span>
                <span className="text-amber-600 dark:text-amber-400">At Risk {atRisk}</span>
                <span className="text-red-600 dark:text-red-400">Off Track {offTrack}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}