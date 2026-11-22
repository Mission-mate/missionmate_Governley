import React from 'react';

/**
 * Active-filter count shown on the Filter toolbar button — a number inside a
 * white circle. Used only by Filter triggers.
 */
export default function FilterCountBadge({ count }) {
  if (!count) return null;
  return (
    <span className="w-5 h-5 rounded-full bg-white flex items-center justify-center text-[11px] font-semibold text-primary leading-none">
      {count}
    </span>
  );
}