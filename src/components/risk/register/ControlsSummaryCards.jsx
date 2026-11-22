import React, { useState } from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';
import SummaryGuidePane from '@/components/risk/dashboard/SummaryGuidePane';
import { cn } from '@/lib/utils';

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
  amber: {
    tint: 'oklch(0.94 0.06 85)',
    from: 'oklch(0.58 0.13 85)',
    to: 'oklch(0.74 0.1 95)',
    label: 'oklch(0.48 0.04 85)',
  },
  green: {
    tint: 'oklch(0.94 0.055 155)',
    from: 'oklch(0.5 0.13 155)',
    to: 'oklch(0.68 0.12 145)',
    label: 'oklch(0.45 0.04 155)',
  },
};

function GlowCard({ label, value, sublabel, hue, onClick }) {
  const s = CARD_STYLES[hue];
  return (
    <div
      onClick={onClick}
      className={cn(GLOW_CARD, onClick && 'cursor-pointer transition-shadow hover:shadow-md')}
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
        {sublabel && (
          <div className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: 'oklch(0.62 0.045 155)' }}>{sublabel}</div>
        )}
      </div>
      <div className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: s.label }}>{label}</div>
    </div>
  );
}

/**
 * Controls Register summary cards.
 * `controls` is already filtered to the active Open/Closed tab by the caller.
 * Operating effectiveness rate: controls rated 'Effective' for operating
 * effectiveness, measured against controls that have been assessed.
 */
export default function ControlsSummaryCards({ controls = [] }) {
  const [guideOpen, setGuideOpen] = useState(false);
  const total = controls.length;
  const ineffective = controls.filter((c) => c.operating_effectiveness === 'Ineffective').length;
  const notAssessed = controls.filter((c) => !c.operating_effectiveness || c.operating_effectiveness === 'Not Assessed').length;
  const assessed = total - notAssessed;
  const fullyEffective = controls.filter((c) => c.operating_effectiveness === 'Effective').length;
  const rate = assessed > 0 ? Math.round((fullyEffective / assessed) * 100) : 0;

  const cards = [
    { label: 'Total Controls', value: total, hue: 'blue' },
    { label: 'Operating Controls Ineffective', value: ineffective, hue: 'crimson' },
    { label: 'Operating Controls Not Assessed', value: notAssessed, hue: 'amber' },
    {
      label: 'Operating Control Effectiveness Rate',
      value: `${rate}%`,
      sublabel: `${fullyEffective} of ${assessed} Effective`,
      hue: 'green',
      onClick: () => setGuideOpen(true),
    },
  ];

  return (
    <>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }} className="mb-6">
        {cards.map((card) => (
          <GlowCard key={card.label} {...card} />
        ))}
      </div>

      <SummaryGuidePane
        isOpen={guideOpen}
        onClose={() => setGuideOpen(false)}
        label="Operating Control Effectiveness Rate"
        value={`${rate}% (${fullyEffective} of ${assessed} Effective)`}
      />
    </>
  );
}