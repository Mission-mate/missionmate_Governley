import React from 'react';
import { format } from 'date-fns';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { OUTCOME_STYLES } from './reviewConstants';
import { sanitizeRiskHtml } from '@/lib/riskHtml';
import SectionCard from '@/components/shared/SectionCard';

function formatDate(d) {
  if (!d) return '—';
  try {
    return format(new Date(d), 'dd MMM yyyy');
  } catch {
    return d;
  }
}

function FieldLabel({ children }) {
  return <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">{children}</Label>;
}

/** Read-only content of the Review side pane. */
export default function ReviewViewBody({ review }) {
  return (
    <>
      <SectionCard>
        <div className="mb-4">
          <FieldLabel>Review Title</FieldLabel>
          <p className="text-sm text-foreground font-medium">{review.title || '—'}</p>
        </div>
        <div>
          <FieldLabel>Review Outcome</FieldLabel>
          {review.outcome ? (
            <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium', OUTCOME_STYLES[review.outcome] || 'bg-muted text-muted-foreground')}>
              {review.outcome}
            </span>
          ) : (
            <p className="text-sm text-muted-foreground/50">—</p>
          )}
        </div>
        <div className="mt-4">
          <FieldLabel>Review Notes</FieldLabel>
          {review.notes ? (
            <div
              className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
              dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(review.notes) }}
            />
          ) : (
            <p className="text-sm text-muted-foreground/50">—</p>
          )}
        </div>
      </SectionCard>

      <SectionCard>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FieldLabel>Review Date</FieldLabel>
            <p className="text-sm text-foreground">{formatDate(review.date)}</p>
          </div>
          <div>
            <FieldLabel>Reviewer</FieldLabel>
            <p className="text-sm text-foreground">{review.reviewer || '—'}</p>
          </div>
        </div>
      </SectionCard>
    </>
  );
}