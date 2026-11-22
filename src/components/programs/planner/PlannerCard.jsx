import React from 'react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import { CardOwner, CardDate } from '@/components/shared/CardMeta';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import ProgramIcon from '@/components/programs/ProgramIcon';
import { BAND_STYLES } from '@/components/programs/ProgramCard';

function fmtDate(d) {
  if (!d) return null;
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

export default function PlannerCard({ planner, source, selected, onSelect }) {
  const navigate = useNavigate();
  const created = fmtDate(planner.date_created);

  return (
    <div onClick={() => navigate(source.detailPath(planner.id))} className={cn('bg-card border rounded-2xl p-4 cursor-pointer relative overflow-hidden shadow-[0_1px_3px_rgba(20,25,40,.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl', selected ? 'border-primary shadow-md' : 'border-border')}>
      <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
        <CircleCheck checked={selected} onChange={onSelect} />
      </div>

      <div className={cn('-mx-4 -mt-4 px-4 pt-4 pb-3 bg-gradient-to-br from-10%', BAND_STYLES[planner.color] || BAND_STYLES.blue)}>
        <div className="flex justify-end mb-2">
          <LifecycleStatusPill status={planner.status} />
        </div>
        <div className="flex items-end gap-3 pl-1">
          <ProgramIcon color={planner.color} />
          <p className="min-w-0 truncate font-bold text-sm text-foreground leading-tight" title={planner.title}>{planner.title}</p>
        </div>
      </div>

      <div className="space-y-1 pl-1 pt-3">
        <CardOwner name={planner.owner} />
        <CardDate>{created && `Created ${created}`}</CardDate>
      </div>
    </div>
  );
}