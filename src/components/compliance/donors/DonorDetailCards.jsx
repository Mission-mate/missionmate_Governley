import React, { useState } from 'react';
import { guardSave } from '@/lib/saveGuard';
import AssetSection from '@/components/compliance/assets/AssetSection';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { DONOR_KIND, recordErrors } from '@/lib/donorRegister';
import RecordFields from './RecordFields';

/** Donor Details + Governance and Risk (+ custom fields) cards, each with its own inline edit. */
export default function DonorDetailCards({ donor, register, donors, customColumns, onSaved }) {
  const saved = DONOR_KIND.pick(donor);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(saved);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const errors = recordErrors(DONOR_KIND, draft, donors, donor.id, attempted);

  useDirtyFlag(!!editing && !draftEqual(draft, saved));

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const start = (key) => { setDraft(saved); setAttempted(false); setEditing(key); };
  const cancel = () => { setEditing(null); setAttempted(false); };
  const save = guardSave(setSaving, async () => {
    if (Object.keys(recordErrors(DONOR_KIND, draft, donors, donor.id, true)).length) return setAttempted(true);
    setSaving(true);
    await DONOR_KIND.api.update(donor.id, draft);
    await onSaved();
    setSaving(false);
    setEditing(null);
  });

  const sections = DONOR_KIND.sections(editing ? draft : saved, DONOR_KIND.fieldOptions(register));
  const cards = [
    ...sections.map((s) => ({ key: s.title, title: s.title, fields: s.fields })),
    ...(customColumns.length ? [{ key: 'custom', title: 'Additional Details', full: true }] : []),
  ];

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {cards.map((c) => {
        const isEditing = editing === c.key;
        const values = isEditing ? draft : saved;
        return (
          <AssetSection key={c.key} title={c.title} className={c.full ? 'xl:col-span-2' : ''} editing={isEditing} locked={!!editing}
            onEdit={() => start(c.key)} onCancel={cancel} onSave={save} saving={saving}>
            {c.fields
              ? <RecordFields fields={c.fields} values={values} set={set} edit={isEditing} errors={isEditing ? errors : {}} />
              : <AssetCustomFields values={values} set={set} edit={isEditing} columns={customColumns} />}
          </AssetSection>
        );
      })}
    </div>
  );
}