import React from 'react';
import FieldOptionRow from '@/components/strategy/customizer/FieldOptionRow';

/** View-only option list inside an expanded field card. `colored` shows each option's colour dot. */
export default function ReadOnlyOptions({ options, colored = false }) {
  const named = options.filter((o) => o.name?.trim());
  if (!named.length) return <p className="text-xs text-muted-foreground py-1">No options yet.</p>;
  return named.map((o, i) =>
    colored ? (
      <FieldOptionRow key={o.id || i} opt={o} readOnly />
    ) : (
      <div key={o.id || i} className="h-8 rounded-md border border-input bg-secondary/40 px-2 flex items-center text-sm text-foreground">
        {o.name}
      </div>
    )
  );
}