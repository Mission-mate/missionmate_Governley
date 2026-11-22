import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const NEUTRAL_SUB = 'oklch(0.5 0.01 90)';

const RED_GRADIENT = 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))';
const BLUE_GRADIENT = 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))';
const GREEN_GRADIENT = 'linear-gradient(135deg, oklch(0.5 0.14 150), oklch(0.68 0.1 160))';
const TEAL_GRADIENT = 'linear-gradient(135deg, oklch(0.5 0.11 190), oklch(0.68 0.09 180))';

function CardShell({ tint, children }) {
  return (
    <div
      className={`rounded-2xl flex flex-col items-start flex-1 min-w-[200px] text-left ${GLOW_CARD}`}
      style={{ padding: '22px 24px', gap: 10, background: glowBackground(tint) }}
    >
      {children}
    </div>
  );
}

function StatLabel({ label, labelColor, note }) {
  return (
    <span className={GLOW_LABEL} style={{ fontSize: 13, fontWeight: 500, color: labelColor }}>
      {label}
      {note && <span className={GLOW_LABEL} style={{ color: NEUTRAL_SUB }}> · {note}</span>}
    </span>
  );
}

// Fixed 32px line box so the 26px Compliance status matches the count cards' height.
function GradientValue({ gradient, fontSize = 32, children }) {
  return (
    <p
      className={`font-extrabold bg-clip-text text-transparent whitespace-nowrap ${GLOW_VALUE}`}
      style={{ fontSize, lineHeight: '32px', height: 32, backgroundImage: gradient, width: 'fit-content' }}
    >
      {children}
    </p>
  );
}

export default function RegisterSummaryCards({ total, active, overdue, noun = 'Register', nounPlural = 'Registers' }) {
  const atRisk = overdue > 0;

  return (
    <div className="flex flex-wrap gap-4">
      <CardShell tint="oklch(0.94 0.045 250)">
        <GradientValue gradient={BLUE_GRADIENT}>{total}</GradientValue>
        <StatLabel label={`Total ${nounPlural}`} labelColor="oklch(0.5 0.06 250)" />
      </CardShell>

      <CardShell tint="oklch(0.93 0.05 185)">
        <GradientValue gradient={TEAL_GRADIENT}>{active}</GradientValue>
        <StatLabel label={`Active ${nounPlural}`} labelColor="oklch(0.5 0.07 190)" />
      </CardShell>

      <CardShell tint="oklch(0.93 0.055 25)">
        <GradientValue gradient={RED_GRADIENT}>{overdue}</GradientValue>
        <StatLabel label={`Overdue ${nounPlural}`} labelColor="oklch(0.53 0.08 25)" />
      </CardShell>

      <CardShell tint={atRisk ? 'oklch(0.93 0.055 25)' : 'oklch(0.93 0.05 150)'}>
        <GradientValue gradient={atRisk ? RED_GRADIENT : GREEN_GRADIENT} fontSize={26}>
          {atRisk ? 'At Risk' : 'On Track'}
        </GradientValue>
        <StatLabel
          label="Compliance"
          labelColor={atRisk ? 'oklch(0.53 0.08 25)' : 'oklch(0.5 0.06 150)'}
          note={atRisk ? `${overdue} overdue ${(overdue > 1 ? nounPlural : noun).toLowerCase()}` : `No overdue ${nounPlural.toLowerCase()}`}
        />
      </CardShell>
    </div>
  );
}