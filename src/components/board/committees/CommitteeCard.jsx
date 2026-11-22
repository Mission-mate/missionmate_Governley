import React from 'react';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ELEVATED_ROW } from '@/components/shared/cardStyles';
import RowSelectCircle from '@/components/strategy/selection/RowSelectCircle';

export default function CommitteeCard({ committee, memberCount = 0, selected = false, onToggleSelect, onView }) {
  const archived = committee.status === 'archived';
  return (
    <div
      onClick={() => onView(committee)}
      className={cn(
        ELEVATED_ROW, 'p-5 flex flex-col cursor-pointer',
        selected && 'border-primary bg-primary/5'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <RowSelectCircle checked={selected} onChange={() => onToggleSelect(committee)} />
      </div>
      <div className="flex items-center gap-2 mt-3">
        <h3 className="font-semibold text-base text-foreground truncate">{committee.name}</h3>
        {archived && (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
            Archived
          </span>
        )}
      </div>
      <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
        {memberCount} member{memberCount === 1 ? '' : 's'}
      </div>
    </div>
  );
}