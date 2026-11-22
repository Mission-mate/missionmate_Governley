import React from 'react';
import { CircleChevronDown, ListChecks, Calendar, User, Type, Gauge, CircleDot, Flag } from 'lucide-react';

const SYSTEM_ICONS = { status: CircleDot, priority: Flag };

const ICONS = {
  'Single Select': CircleChevronDown,
  'Multi Select': ListChecks,
  Date: Calendar,
  People: User,
  'Text/Number': Type,
  Progress: Gauge,
};

// Cycled solid circle palettes (same hues as before, filled; light / dark).
const TINTS = [
  'bg-[#4b9274] text-white dark:bg-emerald-500',
  'bg-[#c18438] text-white dark:bg-orange-500',
  'bg-[#8c69b5] text-white dark:bg-purple-500',
  'bg-[#5479c5] text-white dark:bg-blue-500',
];

/** Field-type icon for a planner column, set in a filled circle badge. */
export default function ColumnTypeIcon({ type, systemKey, index = 0 }) {
  const Icon = SYSTEM_ICONS[systemKey] || ICONS[type] || Type;
  return (
    <span aria-hidden="true" className={`w-6 h-6 shrink-0 grid place-items-center rounded-full transition-[background-color,transform] duration-[180ms] ease-in-out group-hover:-translate-y-px group-hover:saturate-[1.15] ${TINTS[index % TINTS.length]}`}>
      <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
    </span>
  );
}