import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import SectionCard from '@/components/shared/SectionCard';
import { REVIEW_FREQUENCIES, calcNextReviewDate } from '@/lib/reviewDateUtils';
import FieldLabel from './LogRiskFieldLabel';

const FIELD_SURFACE = 'bg-card dark:bg-background';

/** Review Details section of the Log New Risk pane. */
export default function LogRiskReviewFields({ form, update }) {
  // Changing the schedule fills the Next Review Date whenever it can be worked out;
  // the date stays editable so it can also be set by hand.
  const updReview = (fields) => {
    const next = { ...form, ...fields };
    const freq = next.review_frequency;
    if (!freq || freq === 'Ad Hoc' || !next.last_reviewed_date) return update(fields);
    const date = calcNextReviewDate(freq, {
      baseDate: next.last_reviewed_date,
      intervalValue: next.interval_value,
      intervalUnit: next.interval_unit,
    });
    update(date ? { ...fields, next_review_date: date } : fields);
  };

  return (
    <SectionCard title="Review Details">
      <div className="grid grid-cols-2 gap-x-4 gap-y-4">
        <div className="col-span-2">
          <FieldLabel>Review Frequency</FieldLabel>
          <Select value={form.review_frequency} onValueChange={(v) => updReview({ review_frequency: v })}>
            <SelectTrigger className={FIELD_SURFACE}><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {REVIEW_FREQUENCIES.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {form.review_frequency === 'Every' && (
          <>
            <div>
              <FieldLabel>Interval</FieldLabel>
              <Input
                type="number"
                min="1"
                value={form.interval_value}
                onChange={(e) => updReview({ interval_value: e.target.value })}
                placeholder="e.g. 4"
                className={FIELD_SURFACE}
              />
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <Select value={form.interval_unit} onValueChange={(v) => updReview({ interval_unit: v })}>
                <SelectTrigger className={FIELD_SURFACE}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Months">Months</SelectItem>
                  <SelectItem value="Years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        <div>
          <FieldLabel>Last Review Date</FieldLabel>
          <DateField value={form.last_reviewed_date} onChange={(v) => updReview({ last_reviewed_date: v })} inputClassName={FIELD_SURFACE} />
        </div>
        <div>
          <FieldLabel tooltip="Filled in automatically from the Review Frequency and Last Review Date. You can also set it yourself.">Next Review Date</FieldLabel>
          <DateField value={form.next_review_date} onChange={(v) => update({ next_review_date: v })} inputClassName={FIELD_SURFACE} />
        </div>
      </div>
    </SectionCard>
  );
}