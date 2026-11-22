import React, { useState } from 'react';
import { guardSave } from '@/lib/saveGuard';
import AssetSection from '@/components/compliance/assets/AssetSection';
import AssetField from '@/components/compliance/assets/AssetField';
import DateField from '@/components/ui/DateField';
import OptionBadge from '@/components/board/registers/OptionBadge';
import RecordFields from '@/components/compliance/donors/RecordFields';
import useDirtyFlag from '@/hooks/useDirtyFlag';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { updateCoiPerson } from '@/lib/coiPersonProfile';
import { RISK_STYLES, formatDate } from '@/lib/conflictOfInterest';
import { DECLARANT_STATUS_OPTIONS, declarantStats, personTypeOptions, isNameTaken } from '@/lib/declarantRegister';

const KEYS = ['declarant_code', 'full_name', 'person_type', 'role', 'division', 'email', 'status', 'last_declaration_date', 'next_declaration_due'];
const pick = (p) => ({ ...Object.fromEntries(KEYS.map((k) => [k, p[k] || ''])), status: p.status || 'Active' });

/** Declarant Details + Governance and Risk cards, each with its own inline edit (Fixed Asset pattern). */
export default function DeclarantDetailCards({ person, people, conflicts, register, onSaved }) {
  const saved = pick(person);
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(saved);
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  useDirtyFlag(!!editing && !draftEqual(draft, saved));

  const code = draft.declarant_code.trim();
  const errors = {
    ...(attempted && !code && { declarant_code: 'Declarant ID is required.' }),
    ...(code && people.some((p) => p.id !== person.id && p.declarant_code === code) && { declarant_code: `Declarant ID "${code}" is already in use.` }),
    ...(attempted && !draft.full_name.trim() && { full_name: 'Name is required.' }),
    ...(draft.full_name.trim() && isNameTaken(people, draft.full_name, person.id) && { full_name: 'A declarant with this name already exists.' }),
    ...(attempted && !draft.role.trim() && { role: 'Role is required.' }),
  };
  const isValid = () => !!code && !!draft.full_name.trim() && !!draft.role.trim() && !errors.declarant_code && !errors.full_name;

  const set = (k, v) => setDraft((d) => ({ ...d, [k]: v }));
  const start = (key) => { setDraft(saved); setAttempted(false); setEditing(key); };
  const cancel = () => { setEditing(null); setAttempted(false); };
  const save = guardSave(setSaving, async () => {
    if (!isValid()) return setAttempted(true);
    setSaving(true);
    const data = Object.fromEntries(KEYS.map((k) => [k, typeof draft[k] === 'string' ? draft[k].trim() || null : draft[k]]));
    await updateCoiPerson(register.id, person.id, data);
    await onSaved();
    setSaving(false);
    setEditing(null);
  });

  const values = editing ? draft : saved;
  const detailFields = [
    { k: 'declarant_code', label: 'Declarant ID', required: true, mono: true, type: 'text', placeholder: 'e.g., D-0001' },
    { k: 'full_name', label: 'Name', required: true, type: 'text', placeholder: 'e.g., Jane Smith' },
    { k: 'person_type', label: 'Person Type', type: 'select', options: personTypeOptions(register) },
    { k: 'role', label: 'Role', required: true, type: 'text', placeholder: 'e.g., Treasurer' },
    { k: 'division', label: 'Division', type: 'text', placeholder: 'e.g., Finance' },
    { k: 'email', label: 'Email', type: 'text', placeholder: 'e.g., jane@example.com' },
    { k: 'status', label: 'Status', type: 'select', options: DECLARANT_STATUS_OPTIONS },
  ];
  const { openCount, highestRisk } = declarantStats(conflicts, person.id);
  const govEditing = editing === 'gov';
  const dateField = (k, label) => (
    <AssetField label={label} edit={govEditing} display={values[k] ? formatDate(values[k]) : ''}>
      <DateField value={values[k] || ''} onChange={(v) => set(k, v)} inputClassName="bg-card" />
    </AssetField>
  );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <AssetSection title="Declarant Details" editing={editing === 'details'} locked={!!editing}
        onEdit={() => start('details')} onCancel={cancel} onSave={save} saving={saving}>
        <RecordFields fields={detailFields} values={editing === 'details' ? draft : saved} set={set} edit={editing === 'details'} errors={editing === 'details' ? errors : {}} />
      </AssetSection>
      <AssetSection title="Governance and Risk" editing={govEditing} locked={!!editing}
        onEdit={() => start('gov')} onCancel={cancel} onSave={save} saving={saving}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-4">
          <AssetField label="Open Conflicts" display={String(openCount)} hint={govEditing ? 'Calculated from open declarations' : undefined} />
          <AssetField label="Highest Risk Exposure" display={highestRisk ? <OptionBadge label={highestRisk} {...RISK_STYLES[highestRisk]} /> : ''}
            hint={govEditing ? 'Calculated from open declarations' : undefined} />
          {dateField('last_declaration_date', 'Last Declaration Date')}
          {dateField('next_declaration_due', 'Next Declaration Due')}
        </div>
      </AssetSection>
    </div>
  );
}