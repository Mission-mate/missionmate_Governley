import React from 'react';
import { actionSummaryCounts } from '@/lib/actionRegisterHelpers';
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
  green: {
    tint: 'oklch(0.93 0.055 145)',
    from: 'oklch(0.5 0.14 145)',
    to: 'oklch(0.68 0.1 160)',
    label: 'oklch(0.45 0.05 145)',
  },
};

function GlowCard({ label, value, hue, guide }) {
  const s = CARD_STYLES[hue];
  return (
    <div
      className={GLOW_CARD}
      style={{
        flex: '1 1 0',
        minWidth: 160,
        boxSizing: 'border-box',
        borderRadius: 16,
        padding: '22px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: glowBackground(s.tint),
      }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
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
          {value}
        </div>
        {guide && (
          <div className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: 'oklch(0.62 0.045 145)' }}>{guide}</div>
        )}
      </div>
      <div className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: s.label }}>{label}</div>
    </div>
  );
}

export default function ActionSummaryCards({ actions }) {
  const c = actionSummaryCounts(actions);
  const cards = [
    { label: 'Total Risk Treatments', value: c.total, hue: 'blue' },
    { label: 'Overdue Treatments', value: c.overdue, hue: 'crimson' },
    { label: 'High Priority Treatments', value: c.highPriority, hue: 'orange' },
    {
      label: 'Treatment Completion Rate',
      value: `${c.completionPct}%`,
      hue: 'green',
      guide: `${c.closed} of ${c.total} Completed`,
    },
  ];

  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} className="mb-6">
      {cards.map((card) => (
        <GlowCard key={card.label} {...card} />
      ))}
    </div>
  );
}