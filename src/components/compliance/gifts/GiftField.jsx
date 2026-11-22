import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FieldError from '@/components/shared/FieldError';
import LabelText from '@/components/shared/LabelText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ColoredSelect from '@/components/shared/ColoredSelect';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import DateField from '@/components/ui/DateField';
import InfoTooltip from '@/components/risk/InfoTooltip';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { formatMoney } from '@/lib/giftRegister';

/** One labelled register field: input when editing, read-only value otherwise. */
export default function GiftField({ label, k, type = 'text', options, placeholder, values, set, edit, full, error: errorProp, errors, help, colored, required }) {
  const error = errorProp || errors?.[k];
  const v = values[k];
  let control;
  if (type === 'readonly' && edit) {
    control = <Input value={v || ''} readOnly disabled placeholder="Auto-populated" className="bg-card disabled:opacity-100 disabled:cursor-default text-muted-foreground" />;
  } else if (type === 'readonly') control = <p className="text-sm text-foreground">{v || '—'}</p>;
  else if (!edit && type === 'person') {
    control = v ? <div className="flex items-center gap-2"><PersonInitialsAvatar name={v} className="h-6 w-6 text-[10px]" /><span className="text-sm text-foreground truncate">{v}</span></div>
      : <p className="text-sm text-foreground">—</p>;
  } else if (!edit) {
    control = type === 'select' ? <div><AssetBadge value={v} options={options} /></div>
      : <p className="text-sm text-foreground whitespace-pre-wrap break-words">{(type === 'date' ? (v ? formatReviewDate(v) : '') : type === 'money' ? formatMoney(v) : v) || '—'}</p>;
  } else if (type === 'select' && colored) {
    control = <ColoredSelect value={v || ''} onChange={(x) => set(k, x)} options={options} allowClear={!required} className="bg-card" />;
  } else if (type === 'select') {
    control = (
      <Select value={v || undefined} onValueChange={(x) => set(k, x)}>
        <SelectTrigger className="bg-card"><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent className="z-[300]">{options.map((o) => <SelectItem key={o.name} value={o.name}>{o.label || o.name}</SelectItem>)}</SelectContent>
      </Select>
    );
  } else if (type === 'date') control = <DateField value={v || ''} onChange={(x) => set(k, x || '')} className="bg-card" />;
  else if (type === 'long') control = <AutoGrowTextarea value={v || ''} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className="min-h-[72px] bg-card" />;
  else control = <Input type={type === 'money' ? 'number' : 'text'} min={type === 'money' ? 0 : undefined} value={v ?? ''} onChange={(e) => set(k, e.target.value)} placeholder={placeholder} className={error ? 'bg-card border-destructive focus-visible:ring-destructive' : 'bg-card'} />;
  return (
    <div className={full ? 'space-y-1.5 col-span-2' : 'space-y-1.5'}>
      <div className="flex items-center gap-1.5">
        <Label className="text-xs text-muted-foreground"><LabelText label={label} /></Label>
        {help && <InfoTooltip text={help} />}
      </div>
      {control}
      {edit && <FieldError msg={error} />}
    </div>
  );
}