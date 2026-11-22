import React from 'react';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import { CardOwner, CardDate } from '@/components/shared/CardMeta';
import { BAND_STYLES } from '@/components/programs/ProgramCard';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';

function fmtDate(d) {
  if (!d) return null;
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

export default function ProjectCard({ project, selected, onSelect }) {
  const navigate = useNavigate();
  const start = fmtDate(project.start_date);
  const end = fmtDate(project.end_date);

  return (
    <div onClick={() => navigate(`/projects/${project.id}`)} className={cn('bg-card border rounded-2xl p-4 cursor-pointer relative overflow-hidden shadow-[0_1px_3px_rgba(20,25,40,.05)] transition-all duration-200 hover:-translate-y-1 hover:shadow-xl', selected ? 'border-primary shadow-md' : 'border-border')}>
      <div className="absolute top-3 left-3 z-10" onClick={e => e.stopPropagation()}>
        <CircleCheck checked={selected} onChange={onSelect} />
      </div>

      {/* Colour-tinted header holding status, icon and title */}
      <div className={cn('-mx-4 -mt-4 px-4 pt-4 pb-3 bg-gradient-to-br from-10%', BAND_STYLES[project.color] || BAND_STYLES.blue)}>
      <div className="flex justify-end mb-2">
        <LifecycleStatusPill status={project.status} />
      </div>

      <div className="flex items-end gap-3 pl-1">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Target className="w-5 h-5 text-primary" />
        </div>
        <p className="min-w-0 truncate font-bold text-sm text-foreground leading-tight" title={project.title}>{project.title}</p>
      </div>
      </div>

      <div className="space-y-1 pl-1 pt-3">
        <CardOwner name={project.project_officer} />
        <CardDate>{(start || end) && `${start || ''}${end ? ` – ${end}` : ''}`}</CardDate>
      </div>
    </div>
  );
}