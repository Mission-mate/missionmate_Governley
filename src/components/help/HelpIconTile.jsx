import React from 'react';
import { cn } from '@/lib/utils';

// Glossy gradient tiles — literal class strings so Tailwind keeps them.
const TONES = {
  amber: 'from-amber-400 to-amber-600 shadow-amber-500/30',
  green: 'from-emerald-400 to-emerald-600 shadow-emerald-500/30',
  violet: 'from-violet-400 to-purple-600 shadow-purple-500/30',
  red: 'from-rose-400 to-rose-600 shadow-rose-500/30',
  yellow: 'from-yellow-300 to-yellow-500 shadow-yellow-500/30',
};

/** Rounded gradient icon square used across the Help & Support menu. */
export default function HelpIconTile({ icon: Icon, tone }) {
  return (
    <span
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-b text-white shadow-md',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]',
        TONES[tone]
      )}
    >
      <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
    </span>
  );
}