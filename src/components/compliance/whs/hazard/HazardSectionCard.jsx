import WhsValueText from './WhsValueText';
import React, { useState } from 'react';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import { fieldText } from '@/lib/whsHazardFields';
import { formatDisplayDate } from './whsDate';
import WhsFormField from './WhsFormField';
import WhsFieldValue from './WhsFieldValue';
import InfoTooltip from '@/components/risk/InfoTooltip';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useWhsFieldErrors from './useWhsFieldErrors';

/** One hazard overview card with inline, mutex-guarded editing (Risk Register pattern). */
export default function HazardSectionCard({ title, subtitle, record, fields, editing, blocked, onEdit, onClose, onDirty, onSave, footer, children }) {
  const [draft, setDraft] = useState(record);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  // Navigation is already guarded by the edit mutex; this covers Cancel.
  const guard = useUnsavedChanges({ draft, baseline: record, onClose, enabled: editing, saving });
  const source = editing ? draft : record;
  const visible = fields.filter((f) => !f.when || f.when(source));
  const withComputed = (d) => fields.reduce((acc, f) => (f.compute ? { ...acc, [f.key]: f.compute(acc) } : acc), d);
  const [attempted, setAttempted] = useState(false);
  const { errors, blocked: invalid } = useWhsFieldErrors(editing ? visible : [], draft, record.id, attempted);

  const start = () => { setDraft(record); setError(''); setAttempted(false); onEdit(); };
  const save = async () => {
    setAttempted(true);
    if (invalid) return;
    setSaving(true);
    setError('');
    try {
      await onSave(Object.fromEntries(fields.map((f) => [f.key, draft[f.key] ?? null])));
      onClose();
    } catch (e) { setError(e.message || 'Could not save.'); }
    setSaving(false);
  };

  return (
    <section className={ELEVATED_SECTION}>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {children}
        </div>
        {!editing && <SectionEditButton onClick={start} disabled={blocked} className="shrink-0" />}
      </div>
      {editing ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {visible.map((f) => (
              <WhsFormField key={f.key} field={f} value={draft[f.key]} error={errors[f.key]}
                onChange={(v) => { setDraft((d) => withComputed({ ...d, [f.key]: v })); onDirty(); }} />
            ))}
          </div>
          {error && <p className="text-xs text-destructive mt-3">{error}</p>}
          <CardEditFooter onCancel={guard.requestClose} onSave={save} saving={saving} />
        </>
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {visible.map((f) => {
            const raw = record[f.key];
            if (f.type === 'custom') return <WhsFieldValue key={f.key} field={f} value={raw} />;
            const text = (f.type === 'date' || f.type === 'computed') ? formatDisplayDate(raw) : fieldText(f, raw);
            const tone = f.options?.find((o) => typeof o === 'object' && o.value === raw)?.tone;
            return (
              <div key={f.key} className={f.wide ? 'sm:col-span-2' : ''}>
                <dt className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  {f.label}{f.tooltip && <InfoTooltip text={f.tooltip} />}
                </dt>
                <dd className="text-sm text-foreground whitespace-pre-wrap break-words flex items-center gap-2">
                  {text && tone && <span className={`w-2 h-2 rounded-full shrink-0 ${tone.dot}`} />}
                  <WhsValueText field={f} raw={raw} text={text} status={record.status} />
                </dd>
              </div>
            );
          })}
        </dl>
      )}
      {footer?.(source)}
      {guard.dialog}
    </section>
  );
}