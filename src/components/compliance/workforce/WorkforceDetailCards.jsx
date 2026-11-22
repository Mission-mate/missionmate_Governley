import React, { useState } from 'react';
import { guardSave } from '@/lib/saveGuard';
import AssetSection from '@/components/compliance/assets/AssetSection';
import AssetField from '@/components/compliance/assets/AssetField';
import RecordFields from '@/components/compliance/donors/RecordFields';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { pickPerson, updatePerson, personErrors, personStats, STATUS_OPTIONS } from '@/lib/workforceRegister';
import { PERSON_FIELDS } from './AddPersonPane';
import ExpiryDate from './ExpiryDate';
import ComplianceDot from './ComplianceDot';
import usePersonStatusChange from './usePersonStatusChange';

const DETAIL_FIELDS = [...PERSON_FIELDS, { k: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS }];

/** Person Details (inline edit) + Governance and Risk (calculated) cards — Fixed Asset pattern. */
export default function WorkforceDetailCards({ person, people, credentials, onSaved }) {
  const saved = pickPerson(person);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(saved);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const status = usePersonStatusChange(credentials, onSaved);
  useDirtyFlag(editing && !draftEqual(draft, saved));

  const allErrors = personErrors(draft, people, person.id);
  const errors = attempted || allErrors.full_name?.includes('exists') ? allErrors : {};
  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const start = () => { setDraft(saved); setAttempted(false); setEditing(true); };
  const save = guardSave(setSaving, async () => {
    if (Object.keys(allErrors).length) return setAttempted(true);
    setSaving(true);
    const { status: next, ...rest } = draft;
    if (!(await status.request(person, next))) return setSaving(false);
    await updatePerson(person.id, { ...rest, full_name: rest.full_name.trim() });
    await onSaved();
    setSaving(false);
    setEditing(false);
  });

  const s = personStats(credentials, person.id);
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <AssetSection title="Person Details" editing={editing} onEdit={start} onCancel={() => setEditing(false)} onSave={save} saving={saving}>
        <RecordFields fields={DETAIL_FIELDS} values={editing ? draft : saved} set={set} edit={editing} errors={editing ? errors : {}} />
      </AssetSection>
      <AssetSection title="Governance and Risk">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <AssetField label="Compliance" display={<ComplianceDot value={s.compliance} />} />
          <AssetField label="Next Expiry" display={s.nextExpiry ? <ExpiryDate row={s.nextExpiry} /> : ''} />
          <AssetField label="Credentials Held" display={String(s.count)} />
          <AssetField label="Pending Verification" display={String(s.pending)} />
        </div>
      </AssetSection>
      {status.dialog}
    </div>
  );
}