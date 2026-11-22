import React, { useState } from 'react';
import { totalScores, risksOutsideAppetite } from '@/lib/riskAnalytics';
import SummaryGuidePane from './SummaryGuidePane';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const THEMES = {
  orange: { tint: 'oklch(0.93 0.06 40)', from: 'oklch(0.55 0.17 40)', to: 'oklch(0.72 0.13 50)', denom: 'oklch(0.7 0.05 40)', title: 'oklch(0.35 0.03 40)', caption: 'oklch(0.58 0.03 40)' },
  green: { tint: 'oklch(0.93 0.055 145)', from: 'oklch(0.5 0.14 145)', to: 'oklch(0.68 0.1 160)', denom: 'oklch(0.68 0.05 145)', title: 'oklch(0.35 0.03 145)', caption: 'oklch(0.58 0.03 145)' },
  blue: { tint: 'oklch(0.94 0.045 250)', from: 'oklch(0.5 0.14 250)', to: 'oklch(0.7 0.09 235)', title: 'oklch(0.35 0.03 250)', caption: 'oklch(0.58 0.03 250)' },
  crimson: { tint: 'oklch(0.92 0.06 15)', from: 'oklch(0.46 0.2 15)', to: 'oklch(0.64 0.15 25)', title: 'oklch(0.35 0.03 15)', caption: 'oklch(0.58 0.03 15)' },
};

function ScoreCard({ value, denominator, label, sub, theme, onClick }) {
  const t = THEMES[theme];
  return (
    <div
      onClick={onClick}
      className={`${GLOW_CARD} cursor-pointer transition-shadow hover:shadow-md`}
      style={{
        flex: '1 1 0',
        minWidth: 160,
        boxSizing: 'border-box',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: glowBackground(t.tint),
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, position: 'relative', zIndex: 1 }}>
        <span
          className={GLOW_VALUE}
          style={{
            fontSize: 36,
            fontWeight: 800,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {value}
        </span>
        {denominator && (
          <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1, color: t.denom }}>{denominator}</span>
        )}
      </div>
      <span className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 600, color: t.title }}>{label}</span>
      <span className={GLOW_LABEL} style={{ fontSize: 12, fontWeight: 500, color: t.caption }}>{sub}</span>
    </div>
  );
}

export default function RiskScoreCards({ risks, appetiteThreshold = 0 }) {
  const [active, setActive] = useState(null);
  const { inherent, residual } = totalScores(risks);
  const reduction = inherent > 0 ? Math.round(((inherent - residual) / inherent) * 100) : 0;
  const outsideAppetite = risksOutsideAppetite(risks || [], appetiteThreshold).length;

  const cards = [
    { label: 'Inherent Risk Index', value: inherent, denominator: '/100', sub: 'Average before controls', theme: 'orange' },
    { label: 'Residual Risk Index', value: residual, denominator: '/100', sub: 'Average after controls', theme: 'green' },
    { label: 'Risk Reduction', value: `${reduction}%`, sub: 'Inherent → residual', theme: 'blue' },
    { label: 'Risks Outside Appetite', value: outsideAppetite, sub: 'Residual risk', theme: 'crimson' },
  ];

  return (
    <>
      <div className="mb-6" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {cards.map((c) => (
          <ScoreCard key={c.label} {...c} onClick={() => setActive(c)} />
        ))}
      </div>

      <SummaryGuidePane
        isOpen={!!active}
        onClose={() => setActive(null)}
        label={active?.label}
        value={active ? `${active.value}${active.denominator || ''}` : undefined}
      />
    </>
  );
}