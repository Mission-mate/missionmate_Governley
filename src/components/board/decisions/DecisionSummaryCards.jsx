import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

/** Four glow summary tiles for a decisions register, matching the Action Register cards. */
export default function DecisionSummaryCards({ decisions = [] }) {
  const cards = [
    {
      label: 'Total Decisions', count: decisions.length,
      bg: glowBackground('oklch(0.94 0.045 250)'),
      numGrad: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))',
    },
    {
      label: 'Resolutions', count: decisions.filter((d) => d.decision_type === 'Resolution').length,
      bg: glowBackground('oklch(0.94 0.055 55)'),
      numGrad: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))',
    },
    {
      label: 'Approved', count: decisions.filter((d) => d.outcome === 'Approved').length,
      bg: glowBackground('oklch(0.93 0.05 145)'),
      numGrad: 'linear-gradient(135deg, oklch(0.5 0.14 145), oklch(0.68 0.1 160))',
    },
    {
      label: 'Declined', count: decisions.filter((d) => d.outcome === 'Declined').length,
      bg: glowBackground('oklch(0.93 0.055 25)'),
      numGrad: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))',
    },
  ];

  return (
    <div className="flex mb-6" style={{ gap: '16px' }}>
      {cards.map((c) => (
        <div
          key={c.label}
          className={`flex flex-col ${GLOW_CARD}`}
          style={{ background: c.bg, flex: 1, minWidth: '160px', gap: '10px', borderRadius: '16px', padding: '22px 24px', border: 'none' }}
        >
          <div className={GLOW_VALUE} style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, background: c.numGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {c.count}
          </div>
          <div className={GLOW_LABEL} style={{ fontSize: '13px', fontWeight: 500, color: 'oklch(0.5 0.01 90)' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}