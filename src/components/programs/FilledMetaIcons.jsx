import React from 'react';

// Filled glyphs for program card metadata. Colour comes from currentColor.
export function FilledCalendarIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <rect x="6.5" y="1.5" width="2.5" height="5" rx="1.25" />
      <rect x="15" y="1.5" width="2.5" height="5" rx="1.25" />
      <path fillRule="evenodd" d="M5 4h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm-.5 6v9c0 .3.2.5.5.5h14c.3 0 .5-.2.5-.5v-9h-15Zm2.5 2h2.5v2.5H7V12Zm4 0h2.5v2.5H11V12Zm4 0h2.5v2.5H15V12Zm-8 4h2.5v2H7v-2Zm4 0h2.5v2H11v-2Z" />
    </svg>
  );
}