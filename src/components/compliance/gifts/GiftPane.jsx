import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ViewModeHint from '@/components/shared/ViewModeHint';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { emptyGift, pickGift, nextGiftCode, giftFieldErrors, giftCodeErrors, createGift, updateGift } from '@/lib/giftRegister';
import GiftSections from './GiftSections';
import GiftNotesTab from './GiftNotesTab';
import GiftDocumentsTab from './GiftDocumentsTab';
import useRecordCodeCheck from './useRecordCodeCheck';

/** Add (gift = null) or view/edit a gift or benefit record. */
export default function GiftPane({ isOpen, onClose, register, gift, onSaved, startInEdit = false }) {
  const isNew = !gift;
  const [form, setForm] = useState(emptyGift());
  const [baseline, setBaseline] = useState(form);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState('overview');
  const fe = useFieldErrors(giftFieldErrors, form);
  const [saving, setSaving] = useState(false);
  const codeError = useRecordCodeCheck(register.id, form.record_code, gift?.id, isOpen && edit);
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({ draft: { form, notesDirty }, baseline: { form: baseline, notesDirty: false }, onClose, saving, enabled: isOpen, subject: 'gift or benefit changes' });

  useEffect(() => {
    if (!isOpen) return;
    const init = isNew ? emptyGift() : pickGift(gift);
    setForm(init); setBaseline(init); setEdit(isNew || startInEdit); setTab('overview'); fe.reset(); setSaving(false);
    if (isNew) nextGiftCode(register.id).then((code) => {
      setForm((f) => ({ ...f, record_code: f.record_code || code }));
      setBaseline((b) => ({ ...b, record_code: code }));
    });
  }, [isOpen, gift?.id]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const handleSave = guardSave(setSaving, async () => {
    if (!fe.check()) return;
    setSaving(true);
    const dup = await giftCodeErrors(register.id, form, gift?.id);
    if (Object.keys(dup).length) { setSaving(false); return fe.addErrors(dup); }
    if (isNew) await createGift(register.id, form); else await updateGift(gift.id, form);
    await onSaved();
    setBaseline(form); setSaving(false);
    if (isNew) onClose(); else setEdit(false);
  });

  const cancelEdit = () => { setForm(baseline); fe.reset(); };

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground truncate">{isNew ? 'Add Gift or Benefit' : baseline.record_code}</h2>
              <PaneIconHeaderActions showEdit={!isNew && !edit} onEdit={() => setEdit(true)} onClose={() => requestClose()} />
            </div>
            {!isNew && <ViewModeHint className="mt-1.5" editing={edit} />}
            {!isNew && (
              <div className="mt-4">
                <CapsuleTabs animated value={tab} onChange={setTab} className="w-fit" tabs={[{ value: 'overview', label: 'Overview' }, { value: 'notes', label: 'Notes' }, { value: 'documents', label: 'Documents' }]} />
              </div>
            )}
            
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {tab === 'notes' && !isNew ? <GiftNotesTab gift={gift} readOnly={!edit} onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} /> : tab === 'documents' && !isNew ? <GiftDocumentsTab gift={gift} readOnly={!edit} /> : <GiftSections values={form} set={set} edit={edit} codeError={codeError} errors={fe.errors} />}
          </div>
          {/* On Notes, Save Changes writes the note and any edited fields. */}
          {edit && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={isNew || notesDirty || (dirty && tab !== 'documents')} saving={saving || note.saving} saveDisabled={!!codeError}
                onSave={tab === 'notes' ? () => note.saveThen(() => (dirty ? (setTab('overview'), handleSave()) : setEdit(false))) : handleSave}
                onCancel={() => (isNew ? requestClose()
                  : tab === 'notes' ? requestClose(() => { note.cancel(); cancelEdit(); setEdit(false); })
                  : (cancelEdit(), setEdit(false)))} saveLabel={isNew ? 'Add Gift or Benefit' : undefined} />
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}