import React from 'react';
import { PieChart, CheckCircle2, AlertCircle } from 'lucide-react';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

const VARIANTS = {
  blue: {
    tint: 'oklch(0.94 0.045 250)',
    iconBg: 'oklch(0.9 0.06 250)',
    deep: 'oklch(0.5 0.14 250)',
    label: 'oklch(0.5 0.06 250)',
    numFrom: 'oklch(0.5 0.14 250)',
    numTo: 'oklch(0.7 0.09 235)',
  },
  green: {
    tint: 'oklch(0.93 0.05 145)',
    iconBg: 'oklch(0.88 0.07 145)',
    deep: 'oklch(0.5 0.14 145)',
    label: 'oklch(0.5 0.06 145)',
    numFrom: 'oklch(0.5 0.14 145)',
    numTo: 'oklch(0.68 0.1 160)',
  },
  red: {
    tint: 'oklch(0.93 0.055 25)',
    iconBg: 'oklch(0.88 0.08 25)',
    deep: 'oklch(0.53 0.18 25)',
    label: 'oklch(0.53 0.07 25)',
    numFrom: 'oklch(0.53 0.18 25)',
    numTo: 'oklch(0.7 0.13 40)',
  },
};

function Card({ label, value, sub, icon: Icon, variant, onClick }) {
  const v = VARIANTS[variant];
  return (
    <div
      onClick={onClick}
      className={`flex flex-col ${GLOW_CARD} ${onClick ? 'cursor-pointer transition-transform hover:-translate-y-0.5' : ''}`}
      style={{
        borderRadius: '16px',
        padding: '22px 24px',
        gap: '14px',
        background: glowBackground(v.tint),
        flex: 1,
        minWidth: '220px',
      }}
    >
      <div className="flex items-center justify-between">
        <span className={GLOW_LABEL} style={{ fontSize: '14px', fontWeight: 500, color: v.label }}>{label}</span>
        <div
          className="flex items-center justify-center shrink-0"
          style={{ width: '34px', height: '34px', borderRadius: '50%', background: v.iconBg }}
        >
          <Icon size={16} style={{ color: v.deep }} />
        </div>
      </div>
      <div>
        <div
          className={GLOW_VALUE}
          style={{
            fontSize: '32px',
            fontWeight: 800,
            lineHeight: 1,
            background: `linear-gradient(135deg, ${v.numFrom}, ${v.numTo})`,
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            width: 'fit-content',
          }}
        >
          {value}
        </div>
        {sub && (
          <p className={GLOW_LABEL} style={{ fontSize: '13px', fontWeight: 500, color: 'oklch(0.5 0.01 90)', marginTop: '6px' }}>{sub}</p>
        )}
      </div>
    </div>
  );
}

export default function AttendanceSummaryCards({ overall, good, atRisk, goodThreshold, atRiskThreshold, onEditGood, onEditAtRisk }) {
  return (
    <div className="flex flex-wrap mb-6" style={{ gap: '16px' }}>
      <Card label="Overall Attendance" value={`${overall}%`} icon={PieChart} variant="blue" />
      <Card label="Good Attendance" value={good} sub={`Members above ${goodThreshold}% rate`} icon={CheckCircle2} variant="green" onClick={onEditGood} />
      <Card label="At Risk" value={atRisk} sub={`Below ${atRiskThreshold}% attendance`} icon={AlertCircle} variant="red" onClick={onEditAtRisk} />
    </div>
  );
}