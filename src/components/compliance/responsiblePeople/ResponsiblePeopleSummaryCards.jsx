import React from 'react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const BLUE = { tint: 'oklch(0.94 0.045 250)', labelColor: 'oklch(0.5 0.06 250)', gradient: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))' };
const TEAL = { tint: 'oklch(0.93 0.05 185)', labelColor: 'oklch(0.5 0.07 190)', gradient: 'linear-gradient(135deg, oklch(0.5 0.11 190), oklch(0.68 0.09 180))' };
const PURPLE = { tint: 'oklch(0.93 0.045 300)', labelColor: 'oklch(0.5 0.07 300)', gradient: 'linear-gradient(135deg, oklch(0.5 0.13 300), oklch(0.68 0.09 290))' };
const RED = { tint: 'oklch(0.93 0.055 25)', labelColor: 'oklch(0.53 0.08 25)', gradient: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))' };

const CARDS = [
  { key: 'current', label: 'Current Responsible People', tone: BLUE },
  { key: 'board', label: 'Board Members', tone: TEAL },
  { key: 'nonBoard', label: 'Non-Board Members', tone: PURPLE },
  { key: 'overdue', label: 'Overdue Terms', tone: RED },
];

/** Summary counts; data comes from useResponsiblePeopleSummary (loaded before the workspace content renders). */
export default function ResponsiblePeopleSummaryCards({ data, isError }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
      {CARDS.map(({ key, label, tone }) => (
        <div key={key} className={`rounded-2xl flex flex-col items-start min-w-0 px-6 py-[22px] gap-3.5 ${GLOW_CARD}`}
          style={{ background: glowBackground(tone.tint) }}>
          <span className={`text-sm font-medium ${GLOW_LABEL}`} style={{ color: tone.labelColor }}>{label}</span>
          <p className={`text-[32px] leading-[1.2] font-extrabold bg-clip-text text-transparent ${GLOW_VALUE}`}
            style={{ backgroundImage: tone.gradient, width: 'fit-content' }}>
            {isError ? '—' : data?.[key]}
          </p>
          {isError && <span className="text-xs text-destructive">Unable to load count</span>}
        </div>
      ))}
    </div>
  );
}