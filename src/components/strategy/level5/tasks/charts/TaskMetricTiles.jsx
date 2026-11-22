import React from 'react';

const TILES = [
  { key: 'total', label: 'Total Activities', tint: 'oklch(0.94 0.045 250)', labelColor: 'oklch(0.5 0.09 250)', from: 'oklch(0.5 0.14 250)', to: 'oklch(0.7 0.09 235)', plainBg: '#eff6ff', plainColor: '#1d4ed8' },
  { key: 'completed', label: 'Completed', tint: 'oklch(0.93 0.055 145)', labelColor: 'oklch(0.5 0.09 145)', from: 'oklch(0.5 0.14 145)', to: 'oklch(0.68 0.1 160)', plainBg: '#ecfdf5', plainColor: '#059669' },
  { key: 'overdue', label: 'Overdue', tint: 'oklch(0.92 0.06 15)', labelColor: 'oklch(0.5 0.11 15)', from: 'oklch(0.46 0.2 15)', to: 'oklch(0.64 0.15 25)', plainBg: '#fef2f2', plainColor: '#be123c' },
  { key: 'atRisk', label: 'At Risk', tint: 'oklch(0.93 0.06 40)', labelColor: 'oklch(0.53 0.11 40)', from: 'oklch(0.55 0.17 40)', to: 'oklch(0.72 0.13 50)', plainBg: '#fff7ed', plainColor: '#c2410c' },
  { key: 'offTrack', label: 'Off Track', tint: 'oklch(0.91 0.05 20)', labelColor: 'oklch(0.42 0.09 20)', from: 'oklch(0.36 0.12 20)', to: 'oklch(0.52 0.13 25)', plainBg: '#fef2f2', plainColor: '#7f1d1d' },
];

/** Headline execution metrics for a project's tasks & milestones. */
export default function TaskMetricTiles({ metrics }) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
      {TILES.map((t) => (
        <div
          key={t.key}
          data-plain-bg={t.plainBg}
          className="flex flex-col"
          style={{
            borderRadius: 16,
            padding: '20px 22px',
            gap: 10,
            boxSizing: 'border-box',
            background: `radial-gradient(120% 120% at 100% 100%, color-mix(in oklab, ${t.tint} var(--glow-tint-strength), var(--glow-base)) 0%, var(--glow-base) 60%)`,
          }}
        >
          <div data-plain-color={t.plainColor} style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: t.labelColor }}>
            {t.label}
          </div>
          <div
            data-plain-color={t.plainColor}
            style={{
              fontSize: 30,
              fontWeight: 800,
              lineHeight: 1,
              background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            {metrics[t.key]}
          </div>
        </div>
      ))}
    </div>
  );
}