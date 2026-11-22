import React from 'react';
import { format, parseISO } from 'date-fns';
import { Label } from '@/components/ui/label';
import InfoTooltip from '@/components/risk/InfoTooltip';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';

export const TIPS = {
  executive_sponsor: 'Senior Executive responsible for overseeing the program',
  end_date: "Leave blank if the program doesn't have an end date.",
  project_end_date: "Leave blank if the project doesn't have an end date.",
};

export function fmtDate(d) {
  if (!d) return '';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

export function FieldLabel({ children, tip, view }) {
  const cls = view ? 'mb-1 text-xs font-medium text-muted-foreground' : 'mb-1.5 text-xs font-medium text-foreground';
  return <Label className={`flex items-center gap-1 ${cls}`}>{children}{tip && <InfoTooltip text={tip} />}</Label>;
}

export function ReadField({ label, icon: Icon, tip, children }) {
  return (
    <div>
      <FieldLabel view tip={tip}>{label}</FieldLabel>
      <div className="flex items-center gap-2 text-sm text-foreground">
        {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
        <span className="whitespace-pre-wrap">{children || '—'}</span>
      </div>
    </div>
  );
}

export function PersonField({ label, tip, name }) {
  return (
    <div>
      <FieldLabel view tip={tip}>{label}</FieldLabel>
      {name ? (
        <div className="flex items-center gap-2 text-sm text-foreground">
          <PersonInitialsAvatar name={name} className="h-7 w-7 text-[11px]" />
          <span className="truncate">{name}</span>
        </div>
      ) : <span className="text-sm text-foreground">—</span>}
    </div>
  );
}