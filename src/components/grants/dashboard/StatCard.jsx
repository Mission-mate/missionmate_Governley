import React from 'react';
import { cn } from '@/lib/utils';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const TONES = {
  blue: {
    glow: 'oklch(0.94 0.045 250)',
    label: 'oklch(0.5 0.06 250)',
    iconBg: 'oklch(0.9 0.06 250)',
    iconStroke: 'oklch(0.5 0.14 250)',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))',
  },
  green: {
    glow: 'oklch(0.93 0.05 145)',
    label: 'oklch(0.5 0.06 145)',
    iconBg: 'oklch(0.89 0.07 145)',
    iconStroke: 'oklch(0.5 0.14 145)',
    gradient: 'linear-gradient(135deg, oklch(0.5 0.14 145), oklch(0.68 0.1 160))',
  },
  red: {
    glow: 'oklch(0.93 0.055 25)',
    label: 'oklch(0.53 0.08 25)',
    iconBg: 'oklch(0.9 0.07 25)',
    iconStroke: 'oklch(0.53 0.18 25)',
    gradient: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))',
  },
  teal: {
    glow: 'oklch(0.93 0.05 190)',
    label: 'oklch(0.5 0.06 190)',
    iconBg: 'oklch(0.89 0.07 190)',
    iconStroke: 'oklch(0.5 0.11 190)',
    gradient: 'linear-gradient(135deg, oklch(0.52 0.11 195), oklch(0.66 0.09 180))',
  },
  orange: {
    glow: 'oklch(0.94 0.055 55)',
    label: 'oklch(0.55 0.08 55)',
    iconBg: 'oklch(0.9 0.07 55)',
    iconStroke: 'oklch(0.58 0.15 55)',
    gradient: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))',
  },
};

export default function StatCard({ label, value, sublabel, icon: Icon, tone = 'blue', isTextValue = false, onClick }) {
  const t = TONES[tone] || TONES.blue;
  const Comp = onClick ? 'button' : 'div';

  return (
    <Comp
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('rounded-2xl flex flex-col min-w-[200px] w-full text-left', GLOW_CARD, onClick && 'transition-shadow hover:shadow-md')}
      style={{ padding: '22px 24px', gap: '14px', background: glowBackground(t.glow) }}
    >
      <div className="flex items-center">
        <span className={cn('text-sm font-medium leading-snug', GLOW_LABEL)} style={{ color: t.label }}>{label}</span>
      </div>
      <div>
        <p
          className={cn('font-extrabold', GLOW_VALUE)}
          style={{
            fontSize: isTextValue ? 28 : 32,
            lineHeight: 1,
            background: t.gradient,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          {value}
        </p>
        {sublabel && (
          <p
            className={cn('font-medium', GLOW_LABEL)}
            style={{ fontSize: 13, marginTop: 6, color: 'oklch(0.5 0.01 90)' }}
          >
            {sublabel}
          </p>
        )}
      </div>
    </Comp>
  );
}