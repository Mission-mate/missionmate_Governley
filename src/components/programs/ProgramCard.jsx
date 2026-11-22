import React from 'react';
import { format, parseISO } from 'date-fns';
import { CardOwner, CardDate } from '@/components/shared/CardMeta';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import CircleCheck from '@/components/shared/CircleCheck';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import ProgramIcon from '@/components/programs/ProgramIcon';

// Top-band gradient tinted by the card's icon colour (light + dark).
export const BAND_STYLES = {
  blue: 'from-card to-blue-100 dark:to-blue-500/20',
  green: 'from-card to-green-100 dark:to-green-500/20',
  purple: 'from-card to-purple-100 dark:to-purple-500/20',
  orange: 'from-card to-orange-100 dark:to-orange-500/20',
  pink: 'from-card to-pink-100 dark:to-pink-500/20',
  teal: 'from-card to-teal-100 dark:to-teal-500/20',
};

function fmtDate(d) {
  if (!d) return null;
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

export default function ProgramCard({ program, selected, onSelect }) {
  const navigate = useNavigate();
  const start = fmtDate(program.start_date);
  const end = fmtDate(program.end_date);

  return (
    <div onClick={() => navigate(`/programs/${program.id}`)} className={cn('bg-card border rounded-2xl p-4 cursor-pointer relative overflow-hidden shadow-[0_1px_3px_rgba(20,25,40,.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl', selected ? 'border-primary shadow-md' : 'border-border')}>
      {/* Checkbox */}
      <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
        <CircleCheck checked={selected} onChange={onSelect} />
      </div>

      {/* Colour-tinted header holding status, icon and title */}
      <div className={cn('-mx-4 -mt-4 px-4 pt-4 pb-3 bg-gradient-to-br from-10%', BAND_STYLES[program.color] || BAND_STYLES.blue)}>
      <div className="flex justify-end mb-2">
        <LifecycleStatusPill status={program.status} />
      </div>

      <div className="flex items-end gap-3 pl-1">
        <ProgramIcon color={program.color} />
        <p className="min-w-0 truncate font-bold text-sm text-foreground leading-tight" title={program.title}>{program.title}</p>
      </div>
      </div>

      <div className="space-y-1 pl-1 pt-3">
        <CardOwner name={program.program_lead} />
        <CardDate>{(start || end) && `${start || ''}${end ? ` – ${end}` : ''}`}</CardDate>
      </div>
    </div>
  );
}