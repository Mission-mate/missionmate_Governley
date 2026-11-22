import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Loader2 } from 'lucide-react';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SectionCard from '@/components/shared/SectionCard';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { Button } from '@/components/ui/button';
import AssetField from '@/components/compliance/assets/AssetField';
import RecordFields from '@/components/compliance/donors/RecordFields';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { emptyPerson, createPerson, personErrors, PERSON_TYPES } from '@/lib/workforceRegister';
import WorkforcePersonPicker from './WorkforcePersonPicker';

export const PERSON_FIELDS = [
  { k: 'full_name', label: 'Full Name', required: true, type: 'text', placeholder: 'e.g., Jane Smith' },
  { k: 'person_type', label: 'Person Type', type: 'select', options: PERSON_TYPES },
  { k: 'role', label: 'Role', type: 'text', placeholder: 'e.g., Youth worker' },
  { k: 'program_area', label: 'Program or Area', type: 'text', placeholder: 'e.g., Settlement casework' },
  { k: 'email', label: 'Email', type: 'text', placeholder: 'e.g., jane@example.com' },
];

/** Single-form Add Person: New Person (create) or Existing Person (link); then opens the profile. */
export default function AddPersonPane({ isOpen, register, people, onClose, onDone }) {
  const [mode, setMode] = useState('new');
  const [form, setForm] = useState(emptyPerson());
  const [existingId, setExistingId] = useState('');
  const [attempted, setAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({ draft: form, baseline: emptyPerson(), onClose, saving, enabled: isOpen && mode === 'new', subject: 'person' });
  useEffect(() => { if (isOpen) { setMode('new'); setForm(emptyPerson()); setExistingId(''); setAttempted(false); setSaving(false); } }, [isOpen]);

  const allErrors = personErrors(form, people);
  const errors = attempted || allErrors.full_name?.includes('exists') ? allErrors : {};
  const save = guardSave(setSaving, async () => {
    if (mode === 'existing') { onClose(); onDone({ id: existingId }); return; }
    if (Object.keys(allErrors).length) return setAttempted(true);
    setSaving(true);
    const person = await createPerson(register.id, { ...form, full_name: form.full_name.trim() });
    setSaving(false);
    onClose();
    onDone(person);
  });

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-foreground">Add Person</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Choose New Person to add someone new, or Existing Person to open someone already in this register.</p>
            </div>
            <PaneIconHeaderActions showEdit={false} onClose={() => requestClose()} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <CapsuleTabs animated className="flex w-fit mx-auto" value={mode} onChange={setMode}
              tabs={[{ value: 'new', label: 'New Person' }, { value: 'existing', label: 'Existing Person' }]} />
            <SectionCard title="Person Details">
              {mode === 'new'
                ? <RecordFields fields={PERSON_FIELDS} values={form} set={(k, v) => setForm((f) => ({ ...f, [k]: v }))} edit errors={errors} />
                : (
                  <AssetField label="Person Name" required edit>
                    <WorkforcePersonPicker value={existingId} onChange={setExistingId} people={people} />
                  </AssetField>
                )}
            </SectionCard>
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
            <Button onClick={save} disabled={saving || (mode === 'existing' && !existingId)}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : mode === 'new' ? 'Add Person' : 'Open Person'}
            </Button>
          </div>
        </div>
      </SlidePane>
    </>
  );
}