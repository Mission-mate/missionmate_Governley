import React from 'react';

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Text with every case-insensitive occurrence of `term` marked; plain text when there is no term. */
export default function HighlightText({ text, term }) {
  if (!term || !text) return text || null;
  const parts = text.split(new RegExp(`(${escape(term)})`, 'gi'));
  return parts.map((part, i) => (i % 2 === 1
    ? <mark key={i} className="rounded-sm bg-amber-300 text-slate-900 px-0.5">{part}</mark>
    : <React.Fragment key={i}>{part}</React.Fragment>));
}