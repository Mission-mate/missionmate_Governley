import React from 'react';
import { cn } from '@/lib/utils';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const NEUTRAL_GLOW = 'oklch(0.96 0.008 90)';
const NEUTRAL_LABEL = 'oklch(0.5 0.01 90)';

const TONES = {
  blue: {
    glow: 'oklch(0.94 0.045 250)',
    label: 'oklch(0.5 0.06 250)',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))'
  },
  orange: {
    glow: 'oklch(0.94 0.055 55)',
    label: 'oklch(0.55 0.08 55)',
    gradient: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))'
  }
};

function Tile({ label, value, tone }) {
  const t = tone ? TONES[tone] : null;

  const valueStyle = t
    ? {
        background: t.gradient,
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent'
      }
    : {};

  return (
    <div
      className={cn(GLOW_CARD, 'rounded-2xl flex flex-col flex-1 min-w-[200px]')}
      style={{
        padding: '22px 24px',
        gap: '10px',
        background: glowBackground(t ? t.glow : NEUTRAL_GLOW)
      }}>

      <div className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: t ? t.label : NEUTRAL_LABEL }}>
        {label}
      </div>
      <p
        className={cn('font-extrabold text-lg', t ? GLOW_VALUE : 'text-foreground')}
        style={{ fontSize: 30, lineHeight: 1.2, paddingBottom: 2, position: 'relative', zIndex: 1, ...valueStyle }}>

        {value}
      </p>
    </div>);

}

export default function GrantSummaryTiles({ totalAwarded, startDate, endDate, nextDeadline, fmtDate, fmtAmount }) {
  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <Tile label="Total Awarded" value={fmtAmount(totalAwarded)} tone="blue" />
      <Tile label="Start Date" value={fmtDate(startDate)} />
      <Tile label="End Date" value={fmtDate(endDate)} />
      <Tile label="Next Obligation" value={nextDeadline ? fmtDate(nextDeadline.due_date) : '–'} tone="orange" />
    </div>);

}