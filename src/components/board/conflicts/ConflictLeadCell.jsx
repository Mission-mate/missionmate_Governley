import React from 'react';
import { Calendar } from 'lucide-react';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { formatDate } from '@/lib/conflictOfInterest';

/** Leading table columns — Board: Details; Compliance: Declarant and/or Conflict. */
export const LEAD_LABELS = { details: 'Details', declarant: 'Declarant', conflict: 'Conflict' };

export default function ConflictLeadCell({ id, conflict: c }) {
  if (id === 'declarant') {
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        <PersonInitialsAvatar name={c.member_name} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{c.member_name || 'Unassigned'}</p>
          <p className="text-xs text-muted-foreground truncate">{c.conflict_id || '—'}</p>
        </div>
      </div>
    );
  }
  if (id === 'conflict') {
    return (
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{c.title || 'Untitled declaration'}</p>
        {c.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.description}</p>}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5">
      <PersonInitialsAvatar name={c.member_name} />
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground">{c.member_name || 'Unassigned'}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
          <span className="whitespace-nowrap">ID: {c.conflict_id || '—'}</span>
          {c.date_of_disclosure && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 shrink-0" />{formatDate(c.date_of_disclosure)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}