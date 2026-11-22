import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/risk/ColoredSelect';
import { categoryStyleFn } from '@/lib/riskCategoryStyle';
import { getStatusStyle } from '@/components/risk/detail/statusStyles';
import SectionCard from '@/components/shared/SectionCard';
import FieldLabel from './LogRiskFieldLabel';
import LogRiskReviewFields from './LogRiskReviewFields';

const STATUS_OPTIONS = ['Open', 'Closed'];
const FIELD_SURFACE = 'bg-card dark:bg-background';

/** The three grouped sections of the Log New Risk side pane. */
export default function LogRiskFields({ form, update, errors, categoryOptions }) {
  const catOpts = (categoryOptions || []).map((o) => (typeof o === 'object' ? o.name : o));

  // Grow the description textarea to fit its content so long text is fully visible.
  const grow = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };
  const autoGrowRef = React.useCallback((el) => grow(el), [form.description]);
  const autoGrow = (e) => grow(e.target);

  return (
    <div className="space-y-4">
      <SectionCard title="Risk Identification">
        <div className="space-y-4">
          <div>
            <FieldLabel required error={!!errors.risk_id}>Risk ID</FieldLabel>
            <Input
              value={form.risk_id}
              onChange={(e) => update({ risk_id: e.target.value })}
              placeholder="RISK-001"
              className={FIELD_SURFACE}
            />
            {errors.risk_id && <p className="text-xs text-destructive mt-1">{errors.risk_id}</p>}
          </div>
          <div>
            <FieldLabel required error={!!errors.title}>Risk Title</FieldLabel>
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g. Loss of key funding"
              className={FIELD_SURFACE}
            />
            {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
          </div>
          <div>
            <FieldLabel>Risk Description</FieldLabel>
            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              onInput={autoGrow}
              ref={autoGrowRef}
              placeholder="Describe the risk"
              className={`resize-none overflow-hidden ${FIELD_SURFACE}`}
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Risk Details">
        <div className="grid grid-cols-2 gap-x-4 gap-y-4">
          <div>
            <FieldLabel required error={!!errors.category}>Risk Category</FieldLabel>
            <ColoredSelect
              value={form.category || ''}
              onChange={(v) => update({ category: v })}
              options={catOpts}
              styleFor={categoryStyleFn(categoryOptions)}
              placeholder="Select a category..."
              allowClear
              className={FIELD_SURFACE}
            />
            {errors.category && <p className="text-xs text-destructive mt-1">{errors.category}</p>}
          </div>
          <div>
            <FieldLabel>Risk Status</FieldLabel>
            <ColoredSelect
              value={form.status || ''}
              onChange={(v) => update({ status: v })}
              options={STATUS_OPTIONS}
              styleFor={(o) => getStatusStyle(o)}
              placeholder="Select a status..."
              className={FIELD_SURFACE}
            />
          </div>
          <div>
            <FieldLabel required error={!!errors.owner}>Risk Owner</FieldLabel>
            <Input
              value={form.owner}
              onChange={(e) => update({ owner: e.target.value })}
              placeholder="Assign a risk owner"
              className={FIELD_SURFACE}
            />
            {errors.owner && <p className="text-xs text-destructive mt-1">{errors.owner}</p>}
          </div>
          <div>
            <FieldLabel tooltip="Name the person who raised the risk.">Raised By</FieldLabel>
            <Input
              value={form.raised_by}
              onChange={(e) => update({ raised_by: e.target.value })}
              placeholder="e.g. Jane Doe / Finance"
              className={FIELD_SURFACE}
            />
          </div>
          <div>
            <FieldLabel tooltip="Date when the risk was first raised.">Date Raised</FieldLabel>
            <DateField value={form.date_raised} onChange={(v) => update({ date_raised: v })} inputClassName={FIELD_SURFACE} />
          </div>
        </div>
      </SectionCard>

      <LogRiskReviewFields form={form} update={update} />
    </div>
  );
}