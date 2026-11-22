import React from 'react';
import { summaryCounts } from '@/lib/riskRegisterHelpers';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const CARD_STYLES = {
  blue: {
    tint: 'oklch(0.94 0.045 250)',
    from: 'oklch(0.5 0.14 250)',
    to: 'oklch(0.7 0.09 235)',
    label: 'oklch(0.5 0.02 250)',
  },
  crimson: {
    tint: 'oklch(0.92 0.06 15)',
    from: 'oklch(0.46 0.2 15)',
    to: 'oklch(0.64 0.15 25)',
    label: 'oklch(0.45 0.05 15)',
  },
  orange: {
    tint: 'oklch(0.93 0.06 40)',
    from: 'oklch(0.55 0.17 40)',
    to: 'oklch(0.72 0.13 50)',
    label: 'oklch(0.48 0.05 40)',
  },
  amber: {
    tint: 'oklch(0.94 0.06 85)',
    from: 'oklch(0.58 0.13 85)',
    to: 'oklch(0.74 0.1 95)',
    label: 'oklch(0.48 0.04 85)',
  },
  maroon: {
    tint: 'oklch(0.91 0.05 20)',
    from: 'oklch(0.36 0.12 20)',
    to: 'oklch(0.52 0.13 25)',
    label: 'oklch(0.4 0.06 20)',
  },
};

function GlowCard({ label, count, hue }) {
  const s = CARD_STYLES[hue];
  return (
    <div
      className={GLOW_CARD}
      style={{
        flex: '1 1 0',
        minWidth: 140,
        boxSizing: 'border-box',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: glowBackground(s.tint),
      }}>
      <div
        className={GLOW_VALUE}
        style={{
          fontSize: 32,
          fontWeight: 800,
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
          background: `linear-gradient(135deg, ${s.from}, ${s.to})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}>
        {count}
      </div>
      <div className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: s.label }}>{label}</div>
    </div>
  );
}

export default function RiskSummaryCards({ risks }) {
  const c = summaryCounts(risks);
  const cards = [
    { label: 'Total Risks', count: c.total, hue: 'blue' },
    { label: 'Critical Risks', count: c.critical, hue: 'crimson' },
    { label: 'High Risks', count: c.high, hue: 'orange' },
    { label: 'Risks Due for Review', count: c.dueForReview, hue: 'amber' },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} className="mb-6">
      {cards.map((card) => (
        <GlowCard key={card.label} {...card} />
      ))}
    </div>
  );
}