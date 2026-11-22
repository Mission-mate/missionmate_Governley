import React from 'react';
import { cn } from '@/lib/utils';

const RATING = {
  on_track: { label: 'On Track', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  at_risk: { label: 'At Risk', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  off_track: { label: 'Off Track', className: 'bg-red-50 text-red-700 border-red-200' },
};

const SEVERITY_DOT = {
  info: 'bg-blue-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

const STRING_ARRAY_FIELDS = ['gaps', 'opportunities', 'recommendations'];
const FINDING_FIELDS = ['data_quality_findings', 'risks_and_blockers'];

export function RatingBadge({ value }) {
  const rating = RATING[value];
  if (!rating) return null;
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold', rating.className)}>
      {rating.label}
    </span>
  );
}

/** Renders one narrative section, adapting to the shape of its field. */
export default function ReportSectionBlock({ section, narrative }) {
  const value = narrative?.[section.field];
  const empty = value == null || value === '' || (Array.isArray(value) && !value.length);
  if (empty) return null;

  return (
    <section>
      <div className="flex items-center gap-2.5 mb-2">
        <span className="h-3.5 w-1 rounded-full bg-primary" />
        <h3 className="text-sm font-bold text-foreground">{section.title}</h3>
        {section.id === 'overall_status' && <RatingBadge value={narrative.overall_rating} />}
      </div>

      {section.id === 'executive_summary' && narrative.status_statement && (
        <p className="text-sm font-semibold text-foreground mb-2 leading-relaxed">{narrative.status_statement}</p>
      )}

      {section.field === 'level_breakdown' ? (
        <div className="space-y-2.5">
          {value.map((entry, i) => (
            <div key={i} className="rounded-lg border border-border bg-muted/30 px-3.5 py-2.5">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[13px] font-semibold text-foreground">{entry.label}</p>
                <RatingBadge value={entry.status} />
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{entry.assessment}</p>
            </div>
          ))}
        </div>
      ) : FINDING_FIELDS.includes(section.field) ? (
        <div className="space-y-2.5">
          {value.map((finding, i) => (
            <div key={i} className="flex gap-2.5">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', SEVERITY_DOT[finding.severity] || SEVERITY_DOT.info)} />
              <div>
                <p className="text-[13px] font-semibold text-foreground">{finding.title}</p>
                <p className="text-[13px] text-muted-foreground leading-relaxed">{finding.detail}</p>
              </div>
            </div>
          ))}
        </div>
      ) : STRING_ARRAY_FIELDS.includes(section.field) ? (
        <ol className="space-y-1.5">
          {value.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-foreground leading-relaxed">
              <span className="font-semibold text-muted-foreground shrink-0">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{value}</p>
      )}
    </section>
  );
}