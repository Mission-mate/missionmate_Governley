import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { ExternalLink } from 'lucide-react';
import EditFooterActions from '@/components/shared/EditFooterActions';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import { financialYearOf, recordErrors } from '@/lib/donorRegister';
import RecordFields from './RecordFields';

const Section = ({ title, subtitle, children }) => (
  <section className="rounded-xl bg-muted p-5">
    <p className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground ${subtitle ? 'mb-1' : 'mb-4'}`}>{title}</p>
    {subtitle && <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>}
    {children}
  </section>
);

/** Add (record = null) or view/edit a donor or donation in a slide drawer. */
export default function RecordPane({ kind, isOpen, onClose, register, record, startEdit, items, onSaved, customColumns, donors, donorName, defaults, onOpenRecord, onCreated }) {
  const isNew = !record;
  const [form, setForm] = useState(kind.empty());
  const [baseline, setBaseline] = useState(form);
  const [edit, setEdit] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({ draft: form, baseline, onClose, saving, enabled: isOpen, subject: `${kind.label.toLowerCase()} changes` });

  useEffect(() => {
    if (!isOpen) return;
    const init = isNew ? { ...kind.empty(), ...defaults } : kind.pick(record);
    setForm(init); setBaseline(init); setEdit(isNew || !!startEdit); setError(''); setAttempted(false); setSaving(false);
  }, [isOpen, record?.id, startEdit]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v, ...(k === 'date_received' ? { financial_year: financialYearOf(v) } : {}) }));
  const errors = recordErrors(kind, form, items, record?.id, attempted);
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const handleSave = guardSave(setSaving, async () => {
    if (Object.keys(recordErrors(kind, form, items, record?.id, true)).length) return setAttempted(true);
    setSaving(true); setError('');
    const created = isNew ? await kind.api.create(register.id, form) : await kind.api.update(record.id, form);
    await onSaved();
    setBaseline(form); setSaving(false);
    if (!isNew) return setEdit(false);
    onClose();
    onCreated?.(created);
  });

  const cancelEdit = () => { setForm(baseline); setError(''); setAttempted(false); setEdit(false); };
  const isDonation = kind.key === 'donation';
  const title = isNew ? `Add ${kind.label}` : (isDonation ? baseline.donation_code || 'Donation' : baseline.donor_name);

  const renderSection = (s) => (
    <Section key={s.title} title={s.title} subtitle={s.subtitle}>
      <RecordFields fields={s.fields} values={form} set={set} edit={edit} isNew={isNew} donors={donors} donorName={donorName} errors={edit ? errors : {}} />
    </Section>
  );

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{title}</h2>
                {isDonation && !isNew && <p className="text-sm text-muted-foreground truncate mt-0.5">{donorName(baseline.donor_id)}</p>}
              </div>
              <PaneIconHeaderActions showEdit={!isNew && !edit} onEdit={() => setEdit(true)} onClose={() => requestClose()}
                onOpen={onOpenRecord && !isNew ? () => onOpenRecord(record) : undefined} />
            </div>
            {onOpenRecord
              ? !edit && <ViewModeHint className="mt-1.5" icon={ExternalLink} action="open" />
              : !isNew && <ViewModeHint className="mt-1.5" editing={edit} />}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {kind.sections(form, kind.fieldOptions(register)).filter((s) => !s.trailing).map(renderSection)}
            {customColumns.length > 0 && (
              <Section title="Additional Details"><AssetCustomFields values={form} set={set} edit={edit} columns={customColumns} /></Section>
            )}
            {kind.sections(form, kind.fieldOptions(register)).filter((s) => s.trailing).map(renderSection)}
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          {edit && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={isNew || dirty} onSave={handleSave} saving={saving}
                onCancel={() => (isNew ? requestClose() : cancelEdit())} saveLabel={isNew ? `Add ${kind.label}` : undefined} />
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}