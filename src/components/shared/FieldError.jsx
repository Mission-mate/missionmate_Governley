import React from 'react';

/** Inline validation message shown directly beneath a form control. */
export default function FieldError({ msg, id }) {
  if (!msg) return null;
  return <p id={id} role="alert" className="text-xs text-destructive mt-1">{msg}</p>;
}