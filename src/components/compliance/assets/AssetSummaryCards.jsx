import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const CARDS = [
  { key: 'total', label: 'Total Assets', tint: 'oklch(0.94 0.045 250)', labelColor: 'oklch(0.5 0.06 250)', gradient: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))' },
  { key: 'active', label: 'Active Assets', tint: 'oklch(0.93 0.05 185)', labelColor: 'oklch(0.5 0.07 190)', gradient: 'linear-gradient(135deg, oklch(0.5 0.11 190), oklch(0.68 0.09 180))' },
  { key: 'disposed', label: 'Disposed Assets', tint: 'oklch(0.94 0.06 85)', labelColor: 'oklch(0.5 0.04 85)', gradient: 'linear-gradient(135deg, oklch(0.58 0.13 85), oklch(0.74 0.1 95))' },
  { key: 'warranty', label: 'Warranty Expired', tint: 'oklch(0.93 0.055 25)', labelColor: 'oklch(0.53 0.08 25)', gradient: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))' },
];

export default function AssetSummaryCards({ counts }) {
  return (
    <div className="flex flex-wrap gap-4">
      {CARDS.map((c) => (
        <div
          key={c.key}
          className={`rounded-2xl flex flex-col items-start flex-1 min-w-[200px] ${GLOW_CARD}`}
          style={{ padding: '22px 24px', gap: 14, background: glowBackground(c.tint) }}
        >
          <span className={GLOW_LABEL} style={{ fontSize: 14, fontWeight: 500, color: c.labelColor }}>{c.label}</span>
          <p
            className={`font-extrabold bg-clip-text text-transparent ${GLOW_VALUE}`}
            style={{ fontSize: 32, lineHeight: 1.2, backgroundImage: c.gradient, width: 'fit-content' }}
          >
            {counts[c.key]}
          </p>
        </div>
      ))}
    </div>
  );
}