import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ColoredSelect from '@/components/shared/ColoredSelect';
import LabelText from '@/components/shared/LabelText';
import InfoTooltip from '@/components/risk/InfoTooltip';

const FIELDS = [
  { key: 'name', label: 'Name *', placeholder: 'e.g., Jane Smith' },
  { key: 'role', label: 'Role *', placeholder: 'e.g., Treasurer' },
  { key: 'person_type', label: 'Person Type', select: true, tip: 'Need a different type? Add new person types in Customise settings.' },
  { key: 'division', label: 'Division', placeholder: 'e.g., Finance' },
  { key: 'email', label: 'Email', placeholder: 'e.g., jane@example.com', type: 'email' },
];

/** New declarant fields: Name*, Role*, Person Type, Division, Email. */
export default function DeclarantFormFields({ value, onChange, typeOptions, errors = {} }) {
  const set = (k, v) => onChange({ ...value, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <Label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
            <LabelText label={f.label} />
            {f.tip && <InfoTooltip text={f.tip} />}
          </Label>
          {f.select
            ? <ColoredSelect value={value[f.key] || ''} onChange={(v) => set(f.key, v || '')} options={typeOptions} placeholder="Select person type" />
            : <Input type={f.type || 'text'} value={value[f.key] || ''} onChange={(e) => set(f.key, e.target.value)} placeholder={f.placeholder}
                className={errors[f.key] ? 'bg-card border-destructive' : 'bg-card'} />}
          {errors[f.key] && <p className="mt-1 text-xs text-destructive">{errors[f.key]}</p>}
        </div>
      ))}
    </div>
  );
}