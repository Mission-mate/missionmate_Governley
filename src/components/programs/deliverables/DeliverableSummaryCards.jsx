import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const CARDS = [
  { key: 'total', title: 'Total Deliverables', tint: 'oklch(0.94 0.045 250)', from: 'oklch(0.5 0.14 250)', to: 'oklch(0.7 0.09 235)', label: 'oklch(0.5 0.05 250)' },
  { key: 'On Track', title: 'On Track', tint: 'oklch(0.93 0.055 145)', from: 'oklch(0.5 0.14 145)', to: 'oklch(0.68 0.1 160)', label: 'oklch(0.5 0.05 145)' },
  { key: 'At Risk', title: 'At Risk', tint: 'oklch(0.93 0.06 40)', from: 'oklch(0.55 0.17 40)', to: 'oklch(0.72 0.13 50)', label: 'oklch(0.52 0.06 40)' },
  { key: 'Off Track', title: 'Off Track', tint: 'oklch(0.92 0.06 15)', from: 'oklch(0.46 0.2 15)', to: 'oklch(0.64 0.15 25)', label: 'oklch(0.5 0.07 15)' },
];

/** Four health summary cards — same shades as the Strategy register. */
export default function DeliverableSummaryCards({ deliverables }) {
  const value = (k) => (k === 'total' ? deliverables.length : deliverables.filter((d) => d.health === k).length);
  return (
    <div className="mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
      {CARDS.map((c) => (
        <div key={c.key} className={GLOW_CARD} style={{ borderRadius: 16, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10, background: glowBackground(c.tint) }}>
          <span className={GLOW_LABEL} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: c.label }}>{c.title}</span>
          <span className={GLOW_VALUE} style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, backgroundImage: `linear-gradient(135deg, ${c.from}, ${c.to})`, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {value(c.key)}
          </span>
        </div>
      ))}
    </div>
  );
}