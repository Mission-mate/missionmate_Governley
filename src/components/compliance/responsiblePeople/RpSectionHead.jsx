import React from 'react';

/** Section heading with an italic muted subtitle. */
export default function RpSectionHead({ title, subtitle }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {subtitle && <p className="text-xs italic text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}