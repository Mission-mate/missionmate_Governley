import React from 'react';

/**
 * Action Register app icon.
 * Same construction as the Compliance Calendar icon but with a blue header
 * band and blue status chips. `label`, `color` and `title` let other board
 * registers (e.g. Decisions) reuse the same ledger tile. Authored on a 112px reference grid, rendered as
 * an SVG so it stays crisp at any size. Pass a `size` (px).
 */
export default function ActionRegisterIcon({ size = 56, className = '', label = 'ACTIONS', color = '#2966BC', title = 'Action Register' }) {
  const uid = React.useId();
  const clipId = `ar-clip-${uid}`;

  // All coordinates on a 112 reference grid.
  const inset = 17;
  const chip = 9;
  const barGap = 9;
  const barX = inset + chip + barGap;
  const barW = 112 - inset - barX;
  const barH = 5;
  const rowGap = 11;

  const bodyTop = 34;
  const bodyH = 112 - bodyTop;
  const blockH = chip * 3 + rowGap * 2;
  const startY = bodyTop + (bodyH - blockH) / 2;

  const rows = [
    { chipFill: color, barFill: '#E3E3DE' },
    { chipFill: color, barFill: '#E3E3DE' },
    { chipFill: '#C9C9C2', barFill: '#EEEEEA' },
  ];

  return (
    <svg
      width={size}
      height={Math.round(size * 1.1)}
      viewBox="0 0 112 112"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={title}
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="112" height="112" rx="24" ry="24" />
        </clipPath>
      </defs>

      {/* Tile */}
      <rect x="0" y="0" width="112" height="112" rx="24" ry="24" fill="#FFFFFF" className="dark:fill-muted" />

      <g clipPath={`url(#${clipId})`}>
        {/* Header band */}
        <rect x="0" y="0" width="112" height="34" fill={color} />
        <text
          x="56"
          y="17"
          textAnchor="middle"
          dominantBaseline="central"
          fill="#FFFFFF"
          fontFamily="'Inter Tight', 'Inter', ui-sans-serif, system-ui, sans-serif"
          fontWeight="800"
          fontSize="11"
          letterSpacing="1.1"
        >
          {label}
        </text>

        {/* Ledger rows */}
        {rows.map((r, i) => {
          const y = startY + i * (chip + rowGap);
          return (
            <g key={i}>
              <rect x={inset} y={y} width={chip} height={chip} rx="2.5" ry="2.5" fill={r.chipFill} className={i === 2 ? 'dark:fill-foreground/30' : undefined} />
              <rect x={barX} y={y + (chip - barH) / 2} width={barW} height={barH} rx={barH / 2} ry={barH / 2} fill={r.barFill} className={i === 2 ? 'dark:fill-foreground/10' : 'dark:fill-foreground/20'} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}