import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import ViewModeHint from '@/components/shared/ViewModeHint';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import DocumentsTab from '@/components/documents/DocumentsTab';
import { useAuth } from '@/lib/AuthContext';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { listNotePages } from '@/lib/notePages';
import { COMPLAINT_OBJECT_TYPE, emptyComplaint, pickComplaint, nextComplaintCode, complaintFieldErrors, complaintCodeErrors, createComplaint, updateComplaint } from '@/lib/complaintRegister';
import CircleStepper from '@/components/board/workplan/CircleStepper';
import ComplaintSections, { COMPLAINT_STEPS } from './ComplaintSections';

const TABS = [{ value: 'overview', label: 'Overview' }, { value: 'notes', label: 'Notes' }, { value: 'documents', label: 'Documents' }];
const loadNote = async (id) => (await listNotePages(COMPLAINT_OBJECT_TYPE, id))[0] || null;

/** Add (complaint = null) or view/edit a complaint record. */
export default function ComplaintPane({ isOpen, onClose, register, complaint, onSaved, startInEdit = false }) {
  const isNew = !complaint;
  const { user } = useAuth();
  const [form, setForm] = useState(emptyComplaint());
  const [baseline, setBaseline] = useState(form);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState('overview');
  const [step, setStep] = useState(0);
  const lastStep = COMPLAINT_STEPS.length - 1;

  const [saving, setSaving] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({ draft: { form, notesDirty }, baseline: { form: baseline, notesDirty: false }, onClose, saving, enabled: isOpen, subject: 'complaint changes' });
  const fe = useFieldErrors(complaintFieldErrors, form);

  useEffect(() => {
    if (!isOpen) return;
    const init = isNew ? emptyComplaint() : pickComplaint(complaint);
    setForm(init); setBaseline(init); setEdit(isNew || startInEdit); setTab('overview'); setStep(0); fe.reset(); setSaving(false);
    if (isNew) nextComplaintCode(register.id).then((code) => {
      setForm((f) => ({ ...f, complaint_code: f.complaint_code || code }));
      setBaseline((b) => ({ ...b, complaint_code: code }));
    });
  }, [isOpen, complaint?.id]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = guardSave(setSaving, async () => {
    const sync = complaintFieldErrors(form);
    // Jump to the first step holding an invalid field so its inline error is visible.
    if (!fe.check()) return setStep(Object.keys(sync).some((k) => k !== 'details') ? 0 : 1);
    setSaving(true);
    const dup = await complaintCodeErrors(register.id, form, complaint?.id);
    if (Object.keys(dup).length) { setSaving(false); setStep(0); return fe.addErrors(dup); }
    if (isNew) await createComplaint(register.id, form); else await updateComplaint(complaint.id, form);
    await onSaved();
    setBaseline(form); setSaving(false);
    if (isNew) onClose(); else setEdit(false);
  });
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const cancelEdit = () => { setForm(baseline); fe.reset(); };

  let body;
  if (tab === 'notes' && !isNew) body = (
    <SinglePageDocument key={complaint.id} objectType={COMPLAINT_OBJECT_TYPE} objectId={complaint.id}
      queryKey={['notePages', COMPLAINT_OBJECT_TYPE, complaint.id, 'single']} loadPage={loadNote} defaultTitle="Notes"
      breadcrumbRoot={complaint.complaint_code || 'Complaint'} flush readOnly={!edit} errorLabel="notes"
      onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
  );
  else if (tab === 'documents' && !isNew) body = <DocumentsTab objectType={COMPLAINT_OBJECT_TYPE} objectId={complaint.id} currentUser={user} hideTitle readOnly={!edit} compact />;
  else body = (
    <>
      {!isNew && <div className="pb-1"><CircleStepper steps={COMPLAINT_STEPS} current={step} onStepClick={setStep} /></div>}
      <ComplaintSections register={register} values={form} set={set} edit={edit} step={step} errors={fe.errors} />
    </>
  );

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground truncate">{isNew ? 'Add Complaint' : baseline.complainant_name || baseline.complaint_code}</h2>
              <PaneIconHeaderActions showEdit={!isNew && !edit} onEdit={() => setEdit(true)} onClose={() => requestClose()} />
            </div>
            {!isNew && <ViewModeHint className="mt-1.5" editing={edit} />}
            {isNew && <div className="mt-4"><CircleStepper steps={COMPLAINT_STEPS} current={step} onStepClick={setStep} /></div>}
            {!isNew && <div className="mt-4"><CapsuleTabs animated value={tab} onChange={setTab} className="w-fit" tabs={TABS} /></div>}
            
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {body}
          </div>
          {edit && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              {isNew && step < lastStep ? (
                <>
                  <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
                  <Button onClick={() => setStep(step + 1)}>Next</Button>
                </>
              ) : <EditFooterActions dirty={isNew || notesDirty || (dirty && tab !== 'documents')} saving={saving || note.saving}
                onSave={tab === 'notes' ? () => note.saveThen(() => (dirty ? (setTab('overview'), handleSave()) : setEdit(false))) : handleSave}
                onCancel={() => (isNew ? requestClose()
                  : tab === 'notes' ? requestClose(() => { note.cancel(); cancelEdit(); setEdit(false); })
                  : (cancelEdit(), setEdit(false)))} saveLabel={isNew ? 'Add Complaint' : undefined} />}
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}