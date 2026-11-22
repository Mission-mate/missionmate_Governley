import React, { useEffect, useRef, useState } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { emptyVersion, saveVersion, newRequestKey } from '@/lib/policyVersions';
import { cn } from '@/lib/utils';
import VersionDetails from './VersionDetails';
import VersionEmbed from './VersionEmbed';
import VersionFormFields from './VersionFormFields';

const TABS = [{ value: 'details', label: 'Details' }, { value: 'preview', label: 'Preview' }];
const pick = (v) => (v ? Object.fromEntries(Object.keys(emptyVersion()).map((k) => [k, v[k] || ''])) : emptyVersion());

/**
 * One pane for a policy version. An existing version opens view-only with Details / Preview tabs
 * and switches to editing in place; Save Changes or Cancel returns it to view-only.
 * Without a `version` it is the upload form for a new one, which requires a document file.
 */
export default function VersionPane({ isOpen, version, startEditing = false, policyId, onClose, onSaved }) {
  const isAdd = !version;
  const [editing, setEditing] = useState(true);
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState(emptyVersion);
  const [baseline, setBaseline] = useState(form);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [titleError, setTitleError] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const requestKey = useRef(null);
  const upload = useRef({});
  const fieldErrors = useFieldErrors((f) => (f.version_number.trim() ? {} : { version_number: 'Version number is required.' }), form);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { ...form, file: file?.name || '' }, baseline: { ...baseline, file: '' },
    onClose, saving, enabled: isOpen && editing, subject: 'version changes',
  });
  const preview = !isAdd && tab === 'preview';
  const dirty = isAdd || !!file || !draftEqual(form, baseline);

  const clearErrors = () => { setFileError(''); setTitleError(''); setError(''); fieldErrors.reset(); };
  const newRequest = () => { requestKey.current = newRequestKey(); upload.current = {}; };

  useEffect(() => {
    if (!isOpen) return;
    const init = pick(version);
    if (version && !init.display_title) init.display_title = version.file_name || '';
    setForm(init); setBaseline(init); setFile(null); setSaving(false); clearErrors(); newRequest();
    setEditing(!version || startEditing); setTab('details');
  }, [isOpen, version?.id]); // eslint-disable-line

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); if (k === 'display_title') setTitleError(''); };
  // Cancel restores the saved values and returns to view-only; a new version's Cancel closes the pane.
  const cancel = () => (isAdd ? requestClose() : (setForm(baseline), setFile(null), clearErrors(), setEditing(false)));

  const submit = async () => {
    setError('');
    const fileMissing = isAdd && !file;
    const titleMissing = !form.display_title.trim();
    const fieldsOk = fieldErrors.check();
    setFileError(fileMissing ? 'Please upload the document for this version.' : '');
    setTitleError(titleMissing ? 'Document display title is required.' : '');
    if (!fieldsOk || fileMissing || titleMissing) { setTab('details'); return; }
    setSaving(true);
    try {
      const saved = await saveVersion(policyId, version, form, file, requestKey.current, upload.current);
      setBaseline(form); setFile(null); newRequest();
      await onSaved(saved);
      if (isAdd) onClose(); else setEditing(false);
    } catch (e) {
      setError(e.message || "Couldn't save the version.");
      setTab('details');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose} className={cn(preview && 'max-w-5xl')}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">
                  {isAdd ? 'Upload New Version' : editing ? 'Edit Version' : `Version ${version.version_number}`}
                </h2>
                {isAdd
                  ? <p className="text-xs text-muted-foreground mt-0.5">The new version becomes Current, and previous versions retained as Superseded.</p>
                  : <ViewModeHint className="mt-1" editing={editing} />}
              </div>
              <PaneIconHeaderActions showEdit={!isAdd && !editing} onEdit={() => setEditing(true)} onClose={() => requestClose()} />
            </div>
            {!isAdd && <CapsuleTabs animated value={tab} onChange={setTab} tabs={TABS} />}
          </div>
          <div className={cn('flex-1 min-h-0', preview ? 'p-4' : 'px-6 py-5 overflow-y-auto')}>
            {preview ? <VersionEmbed version={version} /> : editing ? (
              <VersionFormFields form={form} set={set} currentFileName={version?.file_name} file={file} onFileChange={setFile}
                errors={{ ...fieldErrors.errors, file: fileError, display_title: titleError }} onFileError={setFileError} error={error} />
            ) : <VersionDetails version={version} />}
          </div>
          {editing && (
            <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={dirty} onCancel={cancel} onSave={submit} saving={saving}
                saveLabel={!isAdd ? undefined : form.status === 'Current' ? 'Publish as Current' : 'Save Version'} />
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}