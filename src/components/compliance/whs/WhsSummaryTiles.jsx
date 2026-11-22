import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

/** Soft-gradient metric tiles; counts come from useWhsTileCounts (loaded before the tab renders). */
export default function WhsSummaryTiles({ tiles, counts }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {tiles.map((t, i) => (
        <div key={i} className={`rounded-2xl flex flex-col items-start ${GLOW_CARD}`}
          style={{ padding: '20px 22px', gap: 12, background: glowBackground(t.tint) }}>
          <span className={GLOW_LABEL} style={{ fontSize: 14, fontWeight: 500, color: t.labelColor }}>{t.label}</span>
          <p className={`font-extrabold bg-clip-text text-transparent ${GLOW_VALUE}`}
            style={{ fontSize: 30, lineHeight: 1.2, backgroundImage: t.gradient, width: 'fit-content' }}>
            {counts[i] ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}