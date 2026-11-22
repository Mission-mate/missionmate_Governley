import React from 'react';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const COLOR_STYLES = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  orange: 'bg-orange-500',
  pink: 'bg-pink-500',
  teal: 'bg-teal-500',
};

/** Coloured program tile shared by the Board card and List table. */
export default function ProgramIcon({ color, size = 'md' }) {
  const sm = size === 'sm';
  return (
    <div className={cn('rounded-lg flex items-center justify-center shrink-0', sm ? 'w-7 h-7 rounded-md' : 'w-9 h-9', COLOR_STYLES[color] || COLOR_STYLES.blue)}>
      <Target className={cn('text-white', sm ? 'w-4 h-4' : 'w-5 h-5')} strokeWidth={2.5} />
    </div>
  );
}