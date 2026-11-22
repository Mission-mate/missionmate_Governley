import React from 'react';

/** Field label text — a trailing " *" (mandatory marker) renders in the destructive red. */
export default function LabelText({ label }) {
  if (typeof label !== 'string' || !label.endsWith(' *')) return label;
  return <>{label.slice(0, -2)}<span className="text-destructive"> *</span></>;
}