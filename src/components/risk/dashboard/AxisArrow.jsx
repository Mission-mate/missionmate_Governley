import React from 'react';

const Head = ({ d, w = 8, h = 8 }) => (
  <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0 block">
    <path d={d} fill="currentColor" />
  </svg>
);

/**
 * Sleek thin double-headed axis arrow with solid triangular heads.
 * orientation: 'horizontal' | 'vertical'. Optional inline label.
 */
export default function AxisArrow({ orientation = 'horizontal', label }) {
  if (orientation === 'vertical') {
    return (
      <div className="flex flex-col items-center h-full text-muted-foreground/70">
        <Head d="M4 0 L8 8 L0 8 Z" />
        <div className="flex-1 w-px bg-current" />
        {label && (
          <span
            className="py-2 text-[11px] font-bold text-muted-foreground whitespace-nowrap"
            style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
          >
            {label}
          </span>
        )}
        <div className="flex-1 w-px bg-current" />
        <Head d="M4 8 L0 0 L8 0 Z" />
      </div>
    );
  }
  return (
    <div className="flex items-center w-full text-muted-foreground/70">
      <Head d="M0 4 L8 0 L8 8 Z" />
      <div className="flex-1 h-px bg-current" />
      {label && <span className="px-2 text-[11px] font-bold text-muted-foreground">{label}</span>}
      <div className="flex-1 h-px bg-current" />
      <Head d="M8 4 L0 0 L0 8 Z" />
    </div>
  );
}