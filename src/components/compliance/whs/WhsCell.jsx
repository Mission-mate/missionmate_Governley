import React from 'react';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import RatingBadge from '@/components/risk/RatingBadge';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import { STATUS_PILL } from '@/lib/whsTabs';
import { localToday } from '@/lib/localClock';
import { SOURCE_TYPES } from '@/lib/whsRegister';
import OptionLabel from '@/components/shared/OptionLabel';
import StrategyCustomCell from '@/components/strategy/customFields/StrategyCustomCell';

const Dash = () => <span className="text-sm text-muted-foreground/50">—</span>;

/** WHS table cell — typography mirrors the Risk Register grid. */
export default function WhsCell({ col, row }) {
  if (col.kind === 'custom') return <StrategyCustomCell column={col.column} value={row.custom_fields?.[col.column.id]} />;
  const v = row[col.key];
  if (col.kind === 'rating') {
    return v ? <RatingBadge rating={v} /> : <span className="text-xs text-muted-foreground">Not assessed</span>;
  }
  if (col.kind === 'title' && col.sub) {
    const s = row[col.sub];
    return (
      <div className="min-w-0">
        <p title={v} className="text-sm font-medium text-foreground truncate min-h-5">{v}</p>
        {s && <p title={s} className="text-xs text-muted-foreground truncate mt-0.5">{s}</p>}
        {col.meta && (
          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
            {col.meta.map((m) => (
              <span key={m.key} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span>{m.label}:</span>
                {m.avatar && row[m.key] && <PersonInitialsAvatar name={row[m.key]} className="h-5 w-5 text-[9px]" />}
                <span>{row[m.key] || '—'}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  if (!v) return <Dash />;
  if (col.kind === 'source') {
    return (
      <div className="min-w-0">
        <p className="text-sm font-medium text-foreground whitespace-nowrap">{SOURCE_TYPES[v]?.label || v}</p>
        {row.source_code && <p className="text-xs text-muted-foreground truncate mt-0.5">{row.source_code}</p>}
      </div>
    );
  }
  if (col.kind === 'title') return <p title={v} className="text-sm font-medium text-foreground line-clamp-1">{v}</p>;
  if (col.kind === 'code') return <span className="text-xs text-muted-foreground whitespace-nowrap">{v}</span>;
  if (col.kind === 'date') {
    const overdue = col.overdue && !['Completed', 'Closed'].includes(row.status) && v < localToday();
    return (
      <span className={cn('text-sm whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
        {formatReviewDate(v)}
        {overdue && <span className="block text-xs font-normal text-destructive">{overdueLabel(v)}</span>}
      </span>
    );
  }
  if (col.kind === 'label') {
    return <OptionLabel name={v} color={col.options.find((o) => o.name === v)?.color} />;
  }
  if (col.kind === 'person') {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-foreground whitespace-nowrap">
        <PersonInitialsAvatar name={v} className="h-6 w-6 text-[10px]" />{v}
      </span>
    );
  }
  if (col.kind === 'pill') {
    return <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap', STATUS_PILL[v] || 'bg-muted text-muted-foreground')}>{v}</span>;
  }
  return <span className="text-sm text-foreground whitespace-nowrap">{v}</span>;
}