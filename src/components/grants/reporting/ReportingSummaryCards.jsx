import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const RED_GRADIENT = 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))';
const BLUE_GRADIENT = 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))';
const GREEN_GRADIENT = 'linear-gradient(135deg, oklch(0.5 0.14 150), oklch(0.68 0.1 160))';
const ORANGE_GRADIENT = 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))';

/** Summary card — gradient value on top, label below (matches the Conflict of Interest Register cards). */
function SummaryCard({ tint, gradient, value, label, labelColor, onClick, clickable }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!clickable}
      className={`rounded-2xl flex flex-col items-start text-left gap-2.5 transition-shadow hover:shadow-md disabled:cursor-default ${GLOW_CARD}`}
      style={{ padding: '22px 24px', background: glowBackground(tint) }}
    >
      <p
        className={`font-extrabold bg-clip-text text-transparent whitespace-nowrap ${GLOW_VALUE}`}
        style={{ fontSize: 32, lineHeight: 1, backgroundImage: gradient, width: 'fit-content' }}
      >
        {value}
      </p>
      <span className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: labelColor }}>{label}</span>
    </button>
  );
}

export default function ReportingSummaryCards({
  notStartedCount = 0,
  overdue,
  inProgressCount = 0,
  onActive,
  onOverdue,
  onInProgress,
  onCompliance,
}) {
  const atRisk = overdue > 0;

  return (
    <div className="mb-6 grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
      <SummaryCard tint="oklch(0.94 0.045 250)" gradient={BLUE_GRADIENT} value={notStartedCount} label="Not Started" labelColor="oklch(0.5 0.02 250)" onClick={onActive} clickable />
      <SummaryCard tint="oklch(0.94 0.055 55)" gradient={ORANGE_GRADIENT} value={inProgressCount} label="In Progress" labelColor="oklch(0.55 0.08 55)" onClick={onInProgress} clickable />
      <SummaryCard tint="oklch(0.93 0.055 25)" gradient={RED_GRADIENT} value={overdue} label="Overdue" labelColor="oklch(0.53 0.08 25)" onClick={onOverdue} clickable />
      <SummaryCard
        tint={atRisk ? 'oklch(0.93 0.055 25)' : 'oklch(0.93 0.05 150)'}
        gradient={atRisk ? RED_GRADIENT : GREEN_GRADIENT}
        value={atRisk ? 'At Risk' : 'On Track'}
        label={`Compliance • ${atRisk ? `${overdue} overdue obligation${overdue > 1 ? 's' : ''}` : 'No overdue obligations'}`}
        labelColor={atRisk ? 'oklch(0.53 0.08 25)' : 'oklch(0.5 0.06 150)'}
        onClick={atRisk ? onCompliance : undefined}
        clickable={atRisk}
      />
    </div>
  );
}