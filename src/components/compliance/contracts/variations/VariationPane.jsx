import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { emptyVariation, pickVariation, variationErrors, pendingContractChange, saveVariation } from '@/lib/contractVariations';
import VariationFields from './VariationFields';
import ApplyVariationDialog from './ApplyVariationDialog';
import VariationNotesTab from './VariationNotesTab';
import CapsuleTabs from '@/components/board/CapsuleTabs';

/** Add (variation === null) or view → edit an existing variation. */
export default function VariationPane({ isOpen, variation, startInEdit = false, contract, onClose, onSaved }) {
  const isNew = !variation;
  const [form, setForm] = useState(emptyVariation());
  const [baseline, setBaseline] = useState(form);
  const [edit, setEdit] = useState(false);
  const fe = useFieldErrors(variationErrors, form);
  const [saving, setSaving] = useState(false);
  const [change, setChange] = useState(null);
  const [tab, setTab] = useState('overview');
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({ draft: { form, notesDirty }, baseline: { form: baseline, notesDirty: false }, onClose, saving, enabled: isOpen && edit, subject: 'variation changes' });

  useEffect(() => {
    if (!isOpen) return;
    const init = variation ? pickVariation(variation) : emptyVariation();
    setForm(init); setBaseline(init); setEdit(!variation || startInEdit); fe.reset(); setSaving(false); setChange(null); setTab('overview');
  }, [isOpen, variation?.id]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const persist = guardSave(setSaving, async (apply) => {
    setSaving(true);
    const saved = await saveVariation({ contract, existing: variation, form, apply });
    await onSaved(saved);
    setChange(null); setSaving(false); setBaseline(form);
    if (isNew) onClose(); else setEdit(false);
  });
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const handleSave = () => {
    if (!fe.check()) return;
    const pending = pendingContractChange(form, variation, contract);
    if (pending) setChange(pending); else persist(false);
  };

  const cancelEdit = () => (isNew ? requestClose() : (setForm(baseline), fe.reset(), setEdit(false)));

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={edit ? requestClose : onClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-foreground truncate">
                {isNew ? `Add Variation: ${contract.contract_code}` : edit ? 'Edit Variation' : 'View Variation'}
              </h2>
              <PaneIconHeaderActions showEdit={!edit} onEdit={() => setEdit(true)} onClose={edit ? () => requestClose() : onClose} />
            </div>
            {!isNew && <ViewModeHint className="mt-1" editing={edit} />}
            {!isNew && (
              <div className="mt-4">
                <CapsuleTabs animated value={tab} onChange={setTab} className="w-fit"
                  tabs={[{ value: 'overview', label: 'Overview' }, { value: 'notes', label: 'Notes' }]} />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {tab === 'notes' && !isNew ? <VariationNotesTab variation={variation} readOnly={!edit} onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} /> : <VariationFields values={form} set={set} edit={edit} contract={contract} errors={fe.errors} />}
          </div>
          {/* On Notes, Save Changes writes the note and any edited fields. */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
            {edit ? (
              <EditFooterActions dirty={isNew || dirty || notesDirty}
                onCancel={tab === 'notes' ? () => requestClose(() => { note.cancel(); cancelEdit(); }) : cancelEdit}
                onSave={tab === 'notes' ? () => note.saveThen(() => (dirty ? (setTab('overview'), handleSave()) : setEdit(false))) : handleSave}
                saving={saving || note.saving} saveLabel={isNew ? 'Add Variation' : undefined} />
            ) : <Button variant="outline" onClick={onClose}>Close</Button>}
          </div>
        </div>
      </SlidePane>
      <ApplyVariationDialog change={change} contract={contract} onChoose={persist} onClose={() => setChange(null)} />
    </>
  );
}