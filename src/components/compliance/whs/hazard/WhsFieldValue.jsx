import React from 'react';
import DOMPurify from 'dompurify';
import { fieldText } from '@/lib/whsHazardFields';
import { STATUS_PILL } from '@/lib/whsTabs';
import { formatDisplayDate } from './whsDate';
import WhsValueText from './WhsValueText';
import StrategyCustomFields from '@/components/strategy/customFields/StrategyCustomFields';

/** Read-only label + value for one WHS field definition. */
export default function WhsFieldValue({ field, value, status }) {
  if (field.type === 'custom') {
    return (
      <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
        <StrategyCustomFields columns={field.columns} values={value || {}} editing={false} />
      </div>
    );
  }
  if (field.type === 'richtext') {
    const html = value && value.replace(/<[^>]*>|&nbsp;/g, '').trim() ? DOMPurify.sanitize(value) : '';
    return (
      <div className="sm:col-span-2">
        <p className="text-xs font-medium text-muted-foreground mb-1">{field.label}</p>
        {html
          ? <div className="text-sm text-foreground break-words [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4" dangerouslySetInnerHTML={{ __html: html }} />
          : <p className="text-sm text-muted-foreground">—</p>}
      </div>
    );
  }
  const text = (field.type === 'date' || field.type === 'computed') ? formatDisplayDate(value) : fieldText(field, value);
  const pill = field.type === 'select' && STATUS_PILL[text];
  return (
    <div className={field.wide ? 'sm:col-span-2' : ''}>
      <p className="text-xs font-medium text-muted-foreground mb-1">{field.label}{field.required && <span className="text-destructive"> *</span>}</p>
      {text && pill
        ? <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${pill}`}>{text}</span>
        : <p className="text-sm text-foreground whitespace-pre-wrap break-words"><WhsValueText field={field} raw={value} text={text} status={status} /></p>}
    </div>
  );
}