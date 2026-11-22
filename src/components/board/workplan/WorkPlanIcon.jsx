import React from 'react';

/**
 * Annual Work Plan app icon — same tile geometry as the Compliance Calendar
 * icon, with a teal header band and a "WORK PLAN" wordmark.
 */
export default function WorkPlanIcon({ size = 56, className = '' }) {
  const uid = React.useId();
  const clipId = `wp-clip-${uid}`;

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
    { chipFill: '#0F766E', barFill: '#DCE9E8' },
    { chipFill: '#0F766E', barFill: '#DCE9E8' },
    { chipFill: '#C0C9C8', barFill: '#EAEFEE' },
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
      aria-label="Annual Work Plan"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width="112" height="112" rx="24" ry="24" />
        </clipPath>
      </defs>

      <rect x="0" y="0" width="112" height="112" rx="24" ry="24" fill="#FFFFFF" className="dark:fill-muted" />

      <g clipPath={`url(#${clipId})`}>
        <rect x="0" y="0" width="112" height="34" fill="#0F766E" />
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
          WORK PLAN
        </text>

        {rows.map((r, i) => {
          const y = startY + i * (chip + rowGap);
          return (
            <g key={i}>
              <rect x={inset} y={y} width={chip} height={chip} rx="2.5" ry="2.5" fill={r.chipFill} className={i === 2 ? 'dark:fill-foreground/30' : 'dark:fill-teal-500'} />
              <rect x={barX} y={y + (chip - barH) / 2} width={barW} height={barH} rx={barH / 2} ry={barH / 2} fill={r.barFill} className={i === 2 ? 'dark:fill-foreground/10' : 'dark:fill-foreground/20'} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}