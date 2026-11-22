import React from 'react';

// Bold, solid-colour glyphs for the Add Task menu, with a staggered opacity reveal.
// Elevated: lifted 1px with a soft tinted drop shadow (neutral dark shadow in dark mode).
const BASE = 'w-[17px] h-[17px] flex-none -translate-y-px dark:drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.6)] animate-[addIconReveal_.55s_cubic-bezier(.2,.7,.25,1)_both]';

export const AddTaskIcon = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={`${BASE} text-[#2563EB] dark:text-blue-400 drop-shadow-[0_1.5px_1.5px_rgba(37,99,235,0.35)] ${className}`}>
    <rect x="2" y="2" width="16" height="16" rx="4" fill="currentColor" />
    <path d="m5.5 10.1 3 3 6-6.2" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AddMilestoneIcon = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={`${BASE} [animation-delay:.07s] text-[#16A34A] dark:text-green-400 drop-shadow-[0_1.5px_1.5px_rgba(22,163,74,0.35)] ${className}`}>
    <path d="M10 1.8 18.2 10 10 18.2 1.8 10 10 1.8Z" fill="currentColor" />
    <path d="m7.3 10 1.8 1.8 3.8-4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const AddColumnIcon = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={`${BASE} [animation-delay:.07s] text-[#9333EA] dark:text-purple-400 drop-shadow-[0_1.5px_1.5px_rgba(147,51,234,0.35)] ${className}`}>
    <rect x="2" y="2" width="4.6" height="16" rx="1.5" fill="currentColor" />
    <rect x="7.7" y="2" width="4.6" height="16" rx="1.5" fill="currentColor" opacity=".8" />
    <rect x="13.4" y="2" width="4.6" height="16" rx="1.5" fill="currentColor" opacity=".62" />
  </svg>
);

export const AddSectionIcon = ({ className = '' }) => (
  <svg viewBox="0 0 20 20" aria-hidden="true" className={`${BASE} [animation-delay:.14s] text-[#F97316] dark:text-orange-400 drop-shadow-[0_1.5px_1.5px_rgba(249,115,22,0.35)] ${className}`}>
    <rect x="2" y="3" width="16" height="4" rx="1.5" fill="currentColor" />
    <rect x="2" y="8.5" width="16" height="3.5" rx="1.4" fill="currentColor" opacity=".8" />
    <rect x="2" y="13.5" width="16" height="3.5" rx="1.4" fill="currentColor" opacity=".62" />
  </svg>
);