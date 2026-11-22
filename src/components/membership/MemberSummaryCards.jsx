import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const TONES = {
  blue: { tint: 'oklch(0.94 0.045 250)', label: 'oklch(0.5 0.06 250)', grad: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))' },
  teal: { tint: 'oklch(0.93 0.05 195)', label: 'oklch(0.48 0.06 195)', grad: 'linear-gradient(135deg, oklch(0.48 0.13 195), oklch(0.66 0.1 200))' },
  orange: { tint: 'oklch(0.94 0.05 55)', label: 'oklch(0.55 0.08 55)', grad: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))' },
  green: { tint: 'oklch(0.93 0.055 145)', label: 'oklch(0.5 0.06 145)', grad: 'linear-gradient(135deg, oklch(0.5 0.14 145), oklch(0.68 0.1 160))' },
  red: { tint: 'oklch(0.93 0.055 25)', label: 'oklch(0.53 0.08 25)', grad: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))' },
};

function GlowCard({ label, value, tone }) {
  const t = TONES[tone];
  return (
    <div
      className={`flex flex-col flex-1 min-w-[150px] ${GLOW_CARD}`}
      style={{ borderRadius: 16, padding: '20px 22px', gap: 10, background: glowBackground(t.tint) }}
    >
      <span className={GLOW_LABEL} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: t.label }}>
        {label}
      </span>
      <span
        className={`bg-clip-text text-transparent ${GLOW_VALUE}`}
        style={{ fontSize: 30, fontWeight: 800, lineHeight: 1, backgroundImage: t.grad, width: 'fit-content' }}
      >
        {value}
      </span>
    </div>
  );
}

export default function MemberSummaryCards({ members, structureCount }) {
  const count = (status) => members.filter((m) => m.status === status).length;
  // Archived members are out of the active register, so they never count toward the total.
  const total = members.filter((m) => (m.status || 'active') !== 'archived').length;

  return (
    <div className="flex flex-wrap gap-4 mb-6">
      <GlowCard label="Total Members" value={total} tone="blue" />
      <GlowCard label="Membership Plans" value={structureCount} tone="teal" />
      <GlowCard label="Active" value={count('active')} tone="green" />
      <GlowCard label="Pending" value={count('pending')} tone="orange" />
      <GlowCard label="Expired" value={count('expired')} tone="red" />
    </div>
  );
}