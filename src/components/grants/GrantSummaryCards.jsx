import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const TONES = {
  blue: {
    glow: 'oklch(0.94 0.045 250)',
    label: 'oklch(0.5 0.06 250)',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))',
  },
  green: {
    glow: 'oklch(0.93 0.05 145)',
    label: 'oklch(0.5 0.06 145)',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.14 145), oklch(0.68 0.1 160))',
  },
  teal: {
    glow: 'oklch(0.93 0.05 195)',
    label: 'oklch(0.48 0.06 195)',
    gradient: 'linear-gradient(135deg, oklch(0.48 0.13 195), oklch(0.66 0.1 200))',
  },
  orange: {
    glow: 'oklch(0.94 0.055 55)',
    label: 'oklch(0.55 0.08 55)',
    gradient: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))',
  },
};

function GlowCard({ label, value, tone }) {
  const t = TONES[tone];
  return (
    <div
      className={`rounded-2xl flex flex-col flex-1 min-w-[200px] ${GLOW_CARD}`}
      style={{ padding: '22px 24px', gap: '10px', background: glowBackground(t.glow) }}
    >
      <p
        className={`font-semibold uppercase ${GLOW_LABEL}`}
        style={{ fontSize: 12, letterSpacing: '0.04em', color: t.label }}
      >
        {label}
      </p>
      <p
        className={`font-extrabold ${GLOW_VALUE}`}
        style={{
          fontSize: 32,
          lineHeight: 1,
          background: t.gradient,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {value}
      </p>
    </div>
  );
}

export default function GrantSummaryCards({ grants }) {
  const totalFunding = grants.reduce((sum, g) => sum + (g.total_amount || 0), 0);
  const fundingReceived = 0; // placeholder
  const providers = new Set(grants.map(g => g.provider).filter(Boolean)).size;

  const fmt = (n) => n.toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 });

  return (
    <div className="flex flex-wrap gap-4 mb-0">
      <GlowCard label="Total Funding Amount" value={fmt(totalFunding)} tone="blue" />
      <GlowCard label="Funding Received" value={fmt(fundingReceived)} tone="green" />
      <GlowCard label="Grants" value={grants.length} tone="teal" />
      <GlowCard label="Funding Providers" value={providers} tone="orange" />
    </div>
  );
}