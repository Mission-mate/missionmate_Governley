import React from 'react';
import { Input } from '@/components/ui/input';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import InfoTooltip from '@/components/risk/InfoTooltip';
import RichTextField from '@/components/shared/RichTextField';
import StrategyCustomFields from '@/components/strategy/customFields/StrategyCustomFields';

/** One editable field driven by a definition from whsHazardFields. */
export default function WhsFormField({ field, value, onChange, error }) {
  if (field.type === 'custom') {
    return (
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StrategyCustomFields columns={field.columns} values={value || {}} editing onChange={onChange} inputClassName="h-9 bg-card" />
      </div>
    );
  }
  const listId = field.suggestions?.length ? `whs-${field.key}-list` : undefined;
  let control;
  const ph = field.placeholder;
  if (field.type === 'richtext') {
    control = <RichTextField value={value || ''} onChange={onChange} placeholder={ph} />;
  } else if (field.type === 'textarea') {
    control = <AutoGrowTextarea value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={ph} className="min-h-[60px] bg-transparent dark:bg-background" />;
  } else if (field.type === 'locked') {
    control = (
      <div className="flex items-center h-9 px-3 rounded-md border border-input !bg-muted/60 text-sm text-muted-foreground cursor-not-allowed">
        {field.format ? field.format(value) : value}
      </div>
    );
  } else if (field.type === 'computed') {
    control = (
      <div className="flex items-center h-9 px-3 rounded-md border border-input !bg-muted/60 text-sm text-foreground">
        {formatReviewDate(value)}
      </div>
    );
  } else if (field.type === 'date') {
    control = <DateField value={value || ''} onChange={onChange} />;
  } else if (field.type === 'select') {
    // ColoredSelect keys options by display name; map numeric options back to their stored value.
    const opts = (field.options || []).map((o) => {
      if (typeof o !== 'object') return { name: o, value: o };
      return o.name ? { ...o, value: o.name } : { name: o.label, value: o.value, tone: o.tone };
    });
    const current = opts.find((o) => o.value === value)?.name || '';
    control = (
      <ColoredSelect value={current} options={opts} allowClear={!field.required}
        onChange={(name) => onChange(opts.find((o) => o.name === name)?.value ?? null)} />
    );
  } else if (field.type === 'number') {
    control = <Input type="number" min="0" value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} placeholder={ph} />;
  } else {
    control = (
      <>
        <Input value={value || ''} onChange={(e) => onChange(e.target.value)} list={listId} placeholder={ph} />
        {listId && <datalist id={listId}>{field.suggestions.map((s) => <option key={s} value={s} />)}</datalist>}
      </>
    );
  }
  // A <label> wrapper redirects clicks to its first button, stealing focus from the rich-text editor.
  const Wrapper = field.type === 'richtext' ? 'div' : 'label';
  return (
    <Wrapper className={field.wide ? 'block sm:col-span-2' : 'block'}>
      <span className="flex items-center gap-1 text-xs font-semibold text-muted-foreground mb-1.5">
        {field.label}{field.required && <span className="text-destructive"> *</span>}
        {field.tooltip && <InfoTooltip text={field.tooltip} />}
      </span>
      {control}
      {error && <span className="block text-xs text-destructive mt-1.5">{error}</span>}
      {field.hint && <span className="block text-xs text-muted-foreground mt-1.5">{field.hint}</span>}
    </Wrapper>
  );
}