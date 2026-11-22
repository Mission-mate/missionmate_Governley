import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { savePolicy, setPolicyStatus, childrenOf, PARENT_TYPE } from '@/lib/policies';
import { policyToForm as fromDoc, reviewHandlers, policyFormErrors, archivesLinked, eligibleParents } from '@/lib/policyForm';
import PolicyFormFields from './PolicyFormFields';
import ArchiveLinkedDialog from './ArchiveLinkedDialog';
import PolicyFileDrop from './PolicyFileDrop';
import StepIndicator from '@/components/compliance/registers/StepIndicator';

const STEPS = [{ n: 1, label: 'Details' }, { n: 2, label: 'Document' }];


/** Add / edit a policy document. `defaultParentId` presets (and locks) the parent. */
export default function PolicyFormPane({ isOpen, onClose, onSaved, doc, docs, types, columns, categories, defaultParentId }) {
  const [form, setForm] = useState(() => fromDoc(null, {}));
  const [baseline, setBaseline] = useState(form);
  const [saving, setSaving] = useState(false);
  const fieldErrors = useFieldErrors((f) => policyFormErrors(f, docs.find((d) => d.id === f.parent_id) || null), form);
  const errors = fieldErrors.errors;
  const [saveError, setSaveError] = useState('');
  const [askArchive, setAskArchive] = useState(false);
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [displayTitle, setDisplayTitle] = useState('');
  const [titleError, setTitleError] = useState('');
  const isAdd = !doc;
  const { requestClose, dialog } = useUnsavedChanges({ draft: form, baseline, onClose, saving, enabled: isOpen, subject: 'policy changes' });

  useEffect(() => {
    if (!isOpen) return;
    const init = fromDoc(doc, { category: categories[0], type: types[0], parentId: defaultParentId });
    setForm(init); setBaseline(init); fieldErrors.reset(); setSaveError(''); setSaving(false); setStep(1); setFile(null); setFileError(''); setDisplayTitle(''); setTitleError('');
  }, [isOpen, doc]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const review = reviewHandlers(setForm);

  const ownChildren = doc ? childrenOf(docs, doc.id) : [];
  // Parents: top-level Policies, excluding self; a document with linked documents can't be nested.
  const parents = eligibleParents(docs, doc, ownChildren, PARENT_TYPE);
  const parent = docs.find((d) => d.id === form.parent_id) || null;

  const save = async (cascade) => {
    setAskArchive(false); setSaving(true);
    let saved;
    try {
      saved = await savePolicy(doc?.id, form, parent, isAdd ? file : null, displayTitle);
      if (cascade) await setPolicyStatus(doc.id, 'archived', true);
    } catch (e) {
      setSaving(false);
      return (isAdd ? setFileError : setSaveError)(`Couldn't save the policy: ${e.message || 'please try again.'}`);
    }
    setBaseline(form); setSaving(false); onSaved(saved); onClose();
  };
  const validateDetails = fieldErrors.check;
  const goToDocument = () => { if (validateDetails()) setStep(2); };
  const goTo = (n) => (n === 2 ? goToDocument() : setStep(1));
  const handleSave = () => {
    if (isAdd) {
      if (!validateDetails()) return setStep(1);
      if (!file) return setFileError('Please upload the policy document.');
      if (!displayTitle.trim()) return setTitleError('Document display title is required.');
      setTitleError('');
      return save(false);
    }
    if (!validateDetails()) return;
    archivesLinked(doc, form, ownChildren) ? setAskArchive(true) : save(false);
  };

  return (
    <>
      {dialog}
      <ArchiveLinkedDialog isOpen={askArchive} count={ownChildren.filter((c) => c.status !== 'archived').length} onChoose={save} onClose={() => setAskArchive(false)} />
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
            <h2 className="text-lg font-bold text-foreground">{doc ? 'Edit Policy' : defaultParentId ? 'Add Linked Document' : 'Add New Policy'}</h2>
            <PaneIconHeaderActions showEdit={false} onClose={() => requestClose()} />
          </div>
          {isAdd && (
            <div className="px-6 pt-4 pb-3 border-b border-border shrink-0">
              <StepIndicator steps={STEPS} step={step} maxStep={2} onGoTo={goTo} className="" />
            </div>
          )}
          <div className="px-6 py-5 flex-1 overflow-y-auto">
            {step === 1 ? (
              <>
                <PolicyFormFields form={form} set={set} types={types} columns={columns} categories={categories} parents={parents} parent={parent} review={review} lockParent={!!defaultParentId} errors={errors} />
                {saveError && <p className="text-xs text-destructive pt-3">{saveError}</p>}
              </>
            ) : (
              <PolicyFileDrop file={file} onChange={setFile} error={fileError} onError={setFileError}
                title={displayTitle} onTitleChange={(v) => { setDisplayTitle(v); setTitleError(''); }} titleError={titleError} />
            )}
          </div>
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            {step === 2 && <Button variant="outline" className="mr-auto" onClick={() => setStep(1)} disabled={saving}>Back</Button>}
            <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
            {isAdd && step === 1
              ? <Button onClick={goToDocument}>Next</Button>
              : <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="w-4 h-4 animate-spin" />}{doc ? 'Save Changes' : 'Add Policy'}</Button>}
          </div>
        </div>
      </SlidePane>
    </>
  );
}