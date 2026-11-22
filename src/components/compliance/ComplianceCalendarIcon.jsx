import React from 'react';

/**
 * Compliance Calendar (Financial Year) app icon.
 * Authored to spec on a 112px reference grid, rendered as an SVG so it stays
 * crisp at any size. Pass a `size` (px) — all elements scale proportionally.
 *
 * Spec (at 112px): square tile, 24px corner radius (~21%), white bg, soft
 * elevation. Amber (#D97706) header band flush to top, 34px tall (~30%),
 * centered uppercase "COMPLIANCE" wordmark. Three left-aligned ledger rows:
 * 9×9 chip (r2.5) + 5px rounded bar, 9px gap, 11px row gap, 17px side inset.
 * Rows 1–2 filed (amber chip / #EDE6DC bar), row 3 open (#CBC5BC chip / #F0EDE8 bar).
 */
export default function ComplianceCalendarIcon({ size = 56, className = '' }) {
  const uid = React.useId();
  const clipId = `cc-clip-${uid}`;

  // All coordinates on a 112 reference grid.
  const inset = 17;
  const chip = 9;
  const barGap = 9;
  const barX = inset + chip + barGap;
  const barW = 112 - inset - barX;
  const barH = 5;
  const rowGap = 11;

  // Vertically center 3 rows in the body (below the 34px band).
  const bodyTop = 34;
  const bodyH = 112 - bodyTop;
  const blockH = chip * 3 + rowGap * 2;
  const startY = bodyTop + (bodyH - blockH) / 2;

  const rows = [
    { chipFill: '#DE7356', barFill: '#EDE6DC' },
    { chipFill: '#DE7356', barFill: '#EDE6DC' },
    { chipFill: '#CBC5BC', barFill: '#F0EDE8' },
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
      aria-label="Compliance Calendar"
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
        <rect x="0" y="0" width="112" height="34" fill="#DE7356" />
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
          COMPLIANCE
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