import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import SectionCard from '@/components/shared/SectionCard';
import FieldError from '@/components/shared/FieldError';
import { REVIEW_FREQUENCIES } from '@/lib/complianceRegisters';

const SECTION_LABEL = 'text-xs font-semibold text-muted-foreground uppercase tracking-wider';
const LAST_REVIEW_GUIDE = 'Updating the Last Review Date automatically recalculates the Next Review Date.';
const NEXT_REVIEW_GUIDE = 'Auto-calculated from frequency and last review date.';

/**
 * Review block for compliance registers — frequency, custom interval,
 * last review date and auto-calculated next review date.
 */
export default function ReviewSection({ form, onFrequency, onIntervalValue, onIntervalUnit, onLastReviewChange, bare = false, frequencyError }) {
  const Wrap = bare ? 'div' : SectionCard;
  const isEvery = form.review_frequency === 'Every';
  const isAdHoc = form.review_frequency === 'Ad Hoc';

  return (
    <Wrap {...(bare ? {} : { title: 'Review Details' })} className="space-y-3">

      <div className="grid grid-cols-2 gap-3">
        <div className={isEvery ? '' : 'col-span-2'}>
          <Label className="mb-1 block text-xs text-muted-foreground">
            Review Frequency <span className="text-destructive">*</span>
          </Label>
          <Select value={form.review_frequency || ''} onValueChange={onFrequency}>
            <SelectTrigger className="bg-white"><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {REVIEW_FREQUENCIES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
            </SelectContent>
          </Select>
          <FieldError msg={frequencyError} />
        </div>
        {isEvery ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Every</Label>
              <Input
                type="number"
                min="1"
                value={form.interval_value || ''}
                onChange={(e) => onIntervalValue(e.target.value)}
                placeholder="e.g. 4"
                className="bg-white"
              />
            </div>
            <div>
              <Label className="mb-1 block text-xs text-muted-foreground">Unit</Label>
              <Select value={form.interval_unit || 'Months'} onValueChange={onIntervalUnit}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Months">Months</SelectItem>
                  <SelectItem value="Years">Years</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">
            Last Review Date {!isAdHoc && <span className="text-destructive">*</span>}
          </Label>
          <DateField value={form.last_review_date || ''} onChange={onLastReviewChange} inputClassName="bg-white" />
          <p className="mt-1 text-xs text-muted-foreground">
            {isAdHoc ? 'Ad Hoc — enter the last review date manually.' : LAST_REVIEW_GUIDE}
          </p>
        </div>
        <div>
          <Label className="mb-1 block text-xs text-muted-foreground">
            Next Review Date {!isAdHoc && <span className="text-destructive">*</span>}
          </Label>
          <DateField
            value={isAdHoc ? '' : form.next_review_date || ''}
            onChange={() => {}}
            disabled
            inputClassName={isAdHoc ? 'bg-muted' : 'bg-white'}
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {isAdHoc ? 'Ad Hoc — No next review date is scheduled.' : NEXT_REVIEW_GUIDE}
          </p>
        </div>
      </div>
    </Wrap>
  );
}