import React from 'react';
import { cn } from '@/lib/utils';

const TONES = {
  blue: 'bg-blue-500 shadow-blue-500/30',
  peach: 'bg-[#DE7356] shadow-[#DE7356]/30',
};

/** Colourful circular badge with a white glyph, used for rail row icons. Constant size in every rail state. */
export default function RailBadgeIcon({ icon: Icon, tone = 'blue', className }) {
  return (
    <span className={cn('shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full text-white shadow-sm', TONES[tone], className)}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2.5} />
    </span>
  );
}