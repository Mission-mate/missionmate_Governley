import React from 'react';
import { Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import GrantActivityHint from '@/components/grants/GrantActivityHint';
import GrantFieldCombobox from '@/components/grants/shared/GrantFieldCombobox';
import GrantStatusSelect from '@/components/grants/shared/GrantStatusSelect';
import { cn } from '@/lib/utils';

function Field({ label, required, hint, children }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground mb-1.5 flex items-center gap-1.5">
        <span>{label}{required && <span className="text-red-500 ml-0.5">*</span>}</span>
        {hint}
      </p>
      {children}
    </div>
  );
}

export default function GrantStepInfo({ form, update, errors }) {
  return (
    <div className="space-y-5">
      {/* Grant Information section */}
      <div className="border border-border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-5">
          <Info className="w-4 h-4 text-primary" />
          <h3 className="text-base font-semibold text-foreground">Grant Information</h3>
        </div>

        <div className="space-y-4">
          {/* Grant Provider + Grant Title */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grant Provider" required>
              <GrantFieldCombobox
                entity="GrantProvider"
                entityLabel="grant funder"
                value={form.provider}
                onSelect={({ id, name }) => update({ provider: name, provider_id: id })}
                placeholder="Search or create a grant funder"
                inputClassName="text-sm"
                error={!!errors?.provider}
              />
              {errors?.provider && <p className="text-xs text-red-500 mt-1">{errors.provider}</p>}
            </Field>
            <Field label="Grant Title" required>
              <Input
                value={form.name}
                onChange={e => update({ name: e.target.value })}
                placeholder="e.g., Cth Community Health Initiative"
                className={cn('text-sm', errors?.name && 'border-red-400')}
              />
              {errors?.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
            </Field>
          </div>

          {/* Reference ID + Status */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grant Reference ID">
              <Input
                value={form.reference_id}
                onChange={e => update({ reference_id: e.target.value })}
                placeholder="e.g., REF-10293"
                className="text-sm"
              />
            </Field>
            <Field label="Status" required>
              <GrantStatusSelect value={form.status} onChange={v => update({ status: v })} />
            </Field>
          </div>

          {/* Grant Activity + Grant Lead */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Grant Activity Title" required hint={<GrantActivityHint />}>
              <GrantFieldCombobox
                entity="GrantActivity"
                entityLabel="activity"
                value={form.program}
                onSelect={({ id, name }) => update({ program: name, activity_id: id })}
                placeholder="Search or create an activity"
                inputClassName="text-sm"
                error={!!errors?.program}
              />
              {errors?.program && <p className="text-xs text-red-500 mt-1">{errors.program}</p>}
            </Field>
            <Field label="Grant Lead (Internal)" required>
              <Input
                value={form.internal_owner}
                onChange={e => update({ internal_owner: e.target.value })}
                placeholder="e.g., Grant Project Manager"
                className={cn('text-sm', errors?.internal_owner && 'border-red-400')}
              />
              {errors?.internal_owner && <p className="text-xs text-red-500 mt-1">{errors.internal_owner}</p>}
            </Field>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" required>
              <DateField
                value={form.start_date}
                onChange={v => update({ start_date: v })}
                placeholder="DD/MM/YYYY"
              />
              {errors?.start_date && <p className="text-xs text-red-500 mt-1">{errors.start_date}</p>}
            </Field>
            <Field label="End Date" required>
              <DateField
                value={form.end_date}
                onChange={v => update({ end_date: v })}
                placeholder="DD/MM/YYYY"
              />
              {errors?.end_date && <p className="text-xs text-red-500 mt-1">{errors.end_date}</p>}
            </Field>
          </div>
        </div>
      </div>
    </div>
  );
}