import React from 'react';

/** Filled bar-chart mark for polls. Takes its colour from the surrounding text colour. */
export default function PollIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <rect x="3" y="12" width="5" height="9" rx="1.75" />
      <rect x="9.5" y="3" width="5" height="18" rx="1.75" />
      <rect x="16" y="8" width="5" height="13" rx="1.75" />
    </svg>
  );
}