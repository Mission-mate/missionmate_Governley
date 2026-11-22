import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LabelText from '@/components/shared/LabelText';
import FieldError from '@/components/shared/FieldError';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import InfoTooltip from '@/components/risk/InfoTooltip';
import { RECORD_TYPE_OPTIONS, INFO_STATUS_OPTIONS, YES_NO_OPTIONS } from '@/lib/infoAssetRegister';

const SELECTS = [
  ['record_type', 'Record Type', RECORD_TYPE_OPTIONS],
  ['status', 'Status', INFO_STATUS_OPTIONS],
  ['personal_information', 'Personal Information', YES_NO_OPTIONS, 'Does it contain personal or sensitive personal information'],
  ['national_security', 'National Security Information', YES_NO_OPTIONS, 'Does it include data which has or could have an impact on matters relating to National Interests'],
];

function Field({ label, tip, children }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground"><LabelText label={label} /></Label>
        {tip && <InfoTooltip text={tip} />}
      </div>
      {children}
    </div>
  );
}

/** Information asset fields — editable inputs, or read-only values when `edit` is false. */
export default function InfoAssetFields({ values, set, edit, isNew, errors = {} }) {
  const text = (k, label, placeholder, tip) => (
    <Field label={label} tip={tip}>
      {edit
        ? <Input value={values[k]} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className="bg-card" />
        : <p className="text-sm text-foreground">{values[k] || '—'}</p>}
      {edit && <FieldError msg={errors[k]} />}
    </Field>
  );
  return (
    <div className="space-y-4">
      {text('title', 'Information Asset Name *', 'e.g., Employee Records')}
      {isNew ? (
        <AddDescriptionToggle value={values.description} onChange={(v) => set('description', v)} />
      ) : edit ? (
        <Field label="Description">
          <AutoGrowTextarea value={values.description || ''} onChange={(e) => set('description', e.target.value)} placeholder="Describe the asset..." className="min-h-[72px]" />
        </Field>
      ) : values.description ? (
        <Field label="Description">
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">{values.description}</p>
        </Field>
      ) : null}
      <div className="grid grid-cols-2 gap-4">
        {SELECTS.map(([k, label, opts, tip]) => (
          <Field key={k} label={label} tip={tip}>
            {edit ? (
              <Select value={values[k] || undefined} onValueChange={(v) => set(k, v)}>
                <SelectTrigger className="bg-card"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent className="z-[300]">{opts.map((o) => <SelectItem key={o.name} value={o.name}>{o.name}</SelectItem>)}</SelectContent>
              </Select>
            ) : <div><AssetBadge value={values[k]} options={opts} /></div>}
          </Field>
        ))}
      </div>
      {text('location', 'Location', 'e.g., SharePoint, Cloud, HR Systems', 'Where the information asset is being stored / Name of the application')}
    </div>
  );
}