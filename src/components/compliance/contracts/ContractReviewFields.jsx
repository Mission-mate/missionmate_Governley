import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import GiftField from '@/components/compliance/gifts/GiftField';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import { REVIEW_FREQUENCIES } from '@/lib/reviewDateUtils';

const FREQ = REVIEW_FREQUENCIES.map((name) => ({ name, color: 'gray' }));
const UNITS = [{ name: 'Months', color: 'gray' }, { name: 'Years', color: 'gray' }];
const Hint = ({ children }) => <p className="text-xs text-muted-foreground">{children}</p>;

/** Review Frequency / Interval / Last Review / auto Next Review — mirrors the WHS hazard Review Details. */
export default function ContractReviewFields({ values, set, edit }) {
  const p = { values, set, edit };
  const isEvery = values.review_frequency === 'Every';
  return (
    <>
      <GiftField {...p} k="review_frequency" label="Review Frequency" type="select" options={FREQ} full />
      {isEvery && <GiftField {...p} k="interval_value" label="Interval" type="money" placeholder="e.g. 4" />}
      {isEvery && <GiftField {...p} k="interval_unit" label="Unit" type="select" options={UNITS} />}
      <div className="space-y-1.5">
        <GiftField {...p} k="last_review_date" label="Last Review Date" type="date" />
        {edit && <Hint>Updating the Last Review Date automatically recalculates the Next Review Date.</Hint>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Next Review Date</Label>
        {edit
          ? <Input value={values.next_review_date ? formatReviewDate(values.next_review_date) : '—'} readOnly disabled className="bg-muted disabled:opacity-100 disabled:cursor-default text-muted-foreground" />
          : <p className="text-sm text-foreground">{values.next_review_date ? formatReviewDate(values.next_review_date) : '—'}</p>}
        {edit && <Hint>Auto-calculated from frequency and last review date.</Hint>}
      </div>
    </>
  );
}