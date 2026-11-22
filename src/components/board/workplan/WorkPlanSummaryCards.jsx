import React from 'react';
import { isDueOverdue } from '@/lib/workPlanApi';
import { glowBackground, GLOW_CARD, GLOW_LABEL, GLOW_VALUE } from '@/lib/glowCard';

/** Five radial-gradient summary tiles for a work plan's items. */
export default function WorkPlanSummaryCards({ items = [], workPlan }) {
  const counts = {
    Total: items.length,
    'Not Started': items.filter((o) => !o.status || o.status === 'Not Started').length,
    'In Progress': items.filter((o) => o.status === 'In Progress').length,
    Overdue: items.filter((o) => isDueOverdue(o.due_date, o.status)).length,
    Completed: items.filter((o) => o.status === 'Completed').length,
  };

  const cards = [
    {
      label: 'Total Work Items', count: counts.Total,
      bg: glowBackground('oklch(0.93 0.05 195)'),
      numGrad: 'linear-gradient(135deg, oklch(0.5 0.11 195), oklch(0.68 0.09 185))',
    },
    {
      label: 'Not Started', count: counts['Not Started'],
      bg: glowBackground('oklch(0.94 0.045 250)'),
      numGrad: 'linear-gradient(135deg, oklch(0.5 0.14 250), oklch(0.7 0.09 235))',
    },
    {
      label: 'In Progress', count: counts['In Progress'],
      bg: glowBackground('oklch(0.94 0.055 55)'),
      numGrad: 'linear-gradient(135deg, oklch(0.58 0.15 55), oklch(0.76 0.12 70))',
    },
    {
      label: 'Overdue', count: counts.Overdue,
      bg: glowBackground('oklch(0.93 0.055 25)'),
      numGrad: 'linear-gradient(135deg, oklch(0.53 0.18 25), oklch(0.7 0.13 40))',
    },
    {
      label: 'Completed', count: counts.Completed,
      bg: glowBackground('oklch(0.93 0.05 145)'),
      numGrad: 'linear-gradient(135deg, oklch(0.5 0.14 145), oklch(0.68 0.1 160))',
    },
  ];

  return (
    <div className="flex mb-6" style={{ gap: '16px' }}>
      {cards.map((c) => (
        <div
          key={c.label}
          className={`flex flex-col ${GLOW_CARD}`}
          style={{ background: c.bg, flex: 1, minWidth: '140px', gap: '10px', borderRadius: '16px', padding: '22px 24px', border: 'none' }}
        >
          <div className={GLOW_VALUE} style={{ fontSize: '32px', fontWeight: 800, lineHeight: 1, background: c.numGrad, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>
            {c.count}
          </div>
          <div className={GLOW_LABEL} style={{ fontSize: '13px', fontWeight: 500, color: 'oklch(0.5 0.01 90)' }}>{c.label}</div>
        </div>
      ))}
    </div>
  );
}