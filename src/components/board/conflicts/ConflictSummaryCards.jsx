import React, { useMemo } from 'react';
import { useLocalToday } from '@/components/LocalDayProvider';
import { isConflictOverdue } from '@/lib/conflictOfInterest';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const TONES = {
  blue: { tint: 'oklch(0.94 0.045 250)', from: 'oklch(0.5 0.14 250)', to: 'oklch(0.7 0.09 235)', label: 'oklch(0.5 0.02 250)' },
  amber: { tint: 'oklch(0.94 0.06 85)', from: 'oklch(0.58 0.13 85)', to: 'oklch(0.74 0.1 95)', label: 'oklch(0.5 0.04 85)' },
  green: { tint: 'oklch(0.93 0.055 145)', from: 'oklch(0.5 0.14 145)', to: 'oklch(0.68 0.1 160)', label: 'oklch(0.48 0.03 145)' },
  red: { tint: 'oklch(0.92 0.06 15)', from: 'oklch(0.46 0.2 15)', to: 'oklch(0.64 0.15 25)', label: 'oklch(0.48 0.05 15)' },
};

export function GlowCard({ value, label, tone }) {
  const t = TONES[tone];
  return (
    <div
      className={GLOW_CARD}
      style={{
        borderRadius: 16,
        padding: '22px 24px',
        border: 'none',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: glowBackground(t.tint),
      }}
    >
      <span
        className={GLOW_VALUE}
        style={{
          fontSize: 32,
          fontWeight: 800,
          lineHeight: 1,
          position: 'relative',
          zIndex: 1,
          background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {value}
      </span>
      <span className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: t.label }}>{label}</span>
    </div>
  );
}

const RED_GRADIENT = 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))';
const GREEN_GRADIENT = 'linear-gradient(135deg, oklch(0.5 0.14 150), oklch(0.68 0.1 160))';

/** Compliance card — matches the Grant Reporting Obligations compliance card. */
function ComplianceCard({ overdue }) {
  const atRisk = overdue > 0;
  return (
    <div
      className={GLOW_CARD}
      style={{
        borderRadius: 16,
        padding: '22px 24px',
        border: 'none',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        background: glowBackground(atRisk ? 'oklch(0.93 0.055 25)' : 'oklch(0.93 0.05 150)'),
      }}
    >
      <p
        className={`font-extrabold bg-clip-text text-transparent whitespace-nowrap ${GLOW_VALUE}`}
        style={{ fontSize: 32, lineHeight: 1, backgroundImage: atRisk ? RED_GRADIENT : GREEN_GRADIENT, width: 'fit-content' }}
      >
        {atRisk ? 'At Risk' : 'On Track'}
      </p>
      <span
        className={GLOW_LABEL}
        style={{ fontSize: 13, fontWeight: 500, color: atRisk ? 'oklch(0.53 0.08 25)' : 'oklch(0.5 0.06 150)' }}
      >
        {`Compliance • ${atRisk ? `${overdue} Overdue for Review` : 'No overdue for review'}`}
      </span>
    </div>
  );
}

export default function ConflictSummaryCards({ conflicts = [] }) {
  const day = useLocalToday();
  const counts = useMemo(() => {
    const open = conflicts.filter((c) => (c.status || 'Open') === 'Open').length;
    const closed = conflicts.filter((c) => c.status === 'Closed').length;
    return {
      total: open + closed,
      open,
      closed,
      overdue: conflicts.filter((c) => isConflictOverdue(c)).length,
    };
  }, [conflicts, day]);

  return (
    <div
      className="mb-5"
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}
    >
      <GlowCard value={counts.total} label="Total Conflict of Interests" tone="blue" />
      <GlowCard value={counts.open} label="Open" tone="amber" />
      <GlowCard value={counts.closed} label="Closed" tone="green" />
      <ComplianceCard overdue={counts.overdue} />
    </div>
  );
}