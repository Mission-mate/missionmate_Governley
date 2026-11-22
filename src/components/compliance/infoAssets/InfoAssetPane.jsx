import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import InfoRiskFields from './InfoRiskFields';
import ViewModeHint from '@/components/shared/ViewModeHint';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import { emptyInfoAsset, pickInfoAsset, createInfoAsset, updateInfoAsset } from '@/lib/infoAssetRegister';
import InfoAssetFields from './InfoAssetFields';
import InfoOwnershipFields from './InfoOwnershipFields';
import InfoControlsTab from './InfoControlsTab';
import AssetCustomFields from '@/components/compliance/assets/AssetCustomFields';

/** Add (asset = null) or view/edit an information asset in a slide drawer. */
export default function InfoAssetPane({ isOpen, onClose, register, asset, onSaved, customColumns = [] }) {
  const isNew = !asset;
  const [form, setForm] = useState(emptyInfoAsset());
  const [baseline, setBaseline] = useState(form);
  const { errors, check, reset } = useFieldErrors((f) => (f.title.trim() ? {} : { title: 'Information Asset Name is required.' }), form);
  const [edit, setEdit] = useState(false);
  const [tab, setTab] = useState('overview');

  const [saving, setSaving] = useState(false);
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({ draft: { form, notesDirty }, baseline: { form: baseline, notesDirty: false }, onClose, saving, enabled: isOpen, subject: 'information asset changes' });

  useEffect(() => {
    if (!isOpen) return;
    const init = isNew ? emptyInfoAsset() : pickInfoAsset(asset);
    setForm(init); setBaseline(init); setEdit(isNew); setTab('overview'); reset(); setSaving(false);
  }, [isOpen, asset?.id]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);

  const handleSave = guardSave(setSaving, async () => {
    if (!check()) return setTab('overview');
    setSaving(true);
    if (isNew) await createInfoAsset(register.id, form); else await updateInfoAsset(asset.id, form);
    await onSaved();
    setBaseline(form); setSaving(false);
    if (isNew) onClose(); else setEdit(false);
  });

  const cancelEdit = () => { setForm(baseline); reset(); };

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground truncate">{isNew ? 'Add Information Asset' : baseline.title}</h2>
              <PaneIconHeaderActions showEdit={!isNew && !edit} onEdit={() => setEdit(true)} onClose={() => requestClose()} />
            </div>
            {!isNew && <ViewModeHint className="mt-1.5" editing={edit} />}
            <div className="mt-4">
              <CapsuleTabs animated value={tab} onChange={setTab} className="w-fit" tabs={[{ value: 'overview', label: 'Overview' }, { value: 'risk', label: 'Risk' }, ...(isNew ? [] : [{ value: 'controls', label: 'Internal Controls' }])]} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            {tab === 'controls' && !isNew ? <InfoControlsTab key={edit ? 'edit' : 'view'} asset={asset} readOnly={!edit} onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} /> : tab === 'risk' ? <InfoRiskFields values={form} set={set} edit={edit} /> : <>
            <section className="rounded-xl bg-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Information Asset Details</p>
              <InfoAssetFields values={form} set={set} edit={edit} isNew={isNew} errors={errors} />
            </section>
            <section className="rounded-xl bg-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Information Ownership</p>
              <InfoOwnershipFields values={form} set={set} edit={edit} />
            </section>
            {customColumns.length > 0 && (
              <section className="rounded-xl bg-muted p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Additional Details</p>
                <AssetCustomFields values={form} set={set} edit={edit} columns={customColumns} />
              </section>
            )}
            </>}
          </div>
          {edit && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              {isNew && tab === 'overview' ? (
                <>
                  <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
                  <Button onClick={() => { if (check()) setTab('risk'); }}>Next</Button>
                </>
              ) : <EditFooterActions dirty={isNew || dirty || notesDirty} saving={saving || note.saving}
                onSave={tab === 'controls' ? () => note.saveThen(() => (dirty ? handleSave() : setEdit(false))) : handleSave}
                onCancel={() => (isNew ? requestClose()
                  : tab === 'controls' ? requestClose(() => { cancelEdit(); setEdit(false); })
                  : (cancelEdit(), setEdit(false)))} saveLabel={isNew ? 'Add Information Asset' : undefined} />}
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}