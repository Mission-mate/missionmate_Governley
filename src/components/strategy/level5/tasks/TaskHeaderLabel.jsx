import React from 'react';
import { User, Calendar, CalendarClock, CircleDot, Flag, Activity, Gauge, Columns3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICONS = {
  owner: [User, 'bg-emerald-500'],
  start_date: [Calendar, 'bg-orange-500'],
  due_date: [CalendarClock, 'bg-orange-500'],
  status: [CircleDot, 'bg-violet-500'],
  priority: [Flag, 'bg-blue-500'],
  health: [Activity, 'bg-rose-500'],
  progress: [Gauge, 'bg-teal-500'],
};
const FALLBACK = [Columns3, 'bg-slate-400'];

/** Column header title with a small solid-filled circular icon. */
export default function TaskHeaderLabel({ columnKey, label }) {
  const [Icon, tone] = ICONS[columnKey] || FALLBACK;
  return (
    <span className="flex items-center gap-2 min-w-0">
      <span className={cn('w-6 h-6 rounded-full grid place-items-center shrink-0 text-white', tone)}>
        <Icon className="w-3.5 h-3.5" strokeWidth={2.2} />
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}