import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { useQueryClient } from '@tanstack/react-query';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SectionCard from '@/components/shared/SectionCard';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { withProfile, isPersonComplete } from '@/lib/conflictScope';
import { updateCoiPerson } from '@/lib/coiPersonProfile';
import { createDeclarant, isNameTaken, personTypeOptions } from '@/lib/declarantRegister';
import CoiPersonPicker from './CoiPersonPicker';
import DeclarantFormFields from './DeclarantFormFields';

const EMPTY = { name: '', role: '', person_type: '', division: '', email: '' };

/** Single-form Add Declarant: New Declarant (create) or Existing Declarant (pick); then opens the profile. */
export default function AddDeclarantPane({ isOpen, register, people, onClose, onDone }) {
  const qc = useQueryClient();
  const [mode, setMode] = useState('new');
  const [form, setForm] = useState(EMPTY);
  const [member, setMember] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (isOpen) { setMode('new'); setForm(EMPTY); setMember(null); } }, [isOpen]);

  const nameTaken = mode === 'new' && !!form.name.trim() && isNameTaken(people, form.name);
  const errors = nameTaken ? { name: 'A declarant with this name already exists. Use Existing Declarant.' } : {};
  const picked = withProfile(member, people);
  const canSave = mode === 'new' ? !!form.name.trim() && !!form.role.trim() && !nameTaken : !!picked?.user_id && isPersonComplete(picked);

  const save = guardSave(setSaving, async () => {
    setSaving(true);
    let id;
    if (mode === 'new') {
      id = (await createDeclarant(register.id, people, form)).id;
    } else {
      id = picked.user_id;
      if (picked.dirty) {
        await updateCoiPerson(register.id, id, { full_name: picked.name.trim(), role: picked.role.trim(), division: (picked.division || '').trim(), email: (picked.email || '').trim() });
      }
    }
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['coiPeople', register.id] }),
      qc.invalidateQueries({ queryKey: ['conflictsOfInterest', register.id] }),
    ]);
    setSaving(false);
    onClose();
    onDone({ id });
  });

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">Add Declarant</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Choose New Declarant to add someone new, or Existing Declarant to open someone already in this register.</p>
          </div>
          <PaneIconHeaderActions showEdit={false} onClose={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <CapsuleTabs animated className="flex w-fit mx-auto" value={mode} onChange={setMode}
            tabs={[{ value: 'new', label: 'New Declarant' }, { value: 'existing', label: 'Existing Declarant' }]} />
          <SectionCard title="Declarant Details">
            {mode === 'new'
              ? <DeclarantFormFields value={form} onChange={setForm} typeOptions={personTypeOptions(register)} errors={errors} />
              : (
                <div>
                  <Label className="mb-1 block text-xs font-medium text-muted-foreground">Person Name <span className="text-destructive">*</span></Label>
                  <CoiPersonPicker member={picked} people={people} onChange={setMember} />
                </div>
              )}
          </SectionCard>
        </div>
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={!canSave || saving}>{saving ? 'Saving...' : mode === 'new' ? 'Add Declarant' : 'Open Declarant'}</Button>
        </div>
      </div>
    </SlidePane>
  );
}