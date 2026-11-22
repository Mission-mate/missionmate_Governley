import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import { emptyAsset, nextAssetId, getAssetOptions, assetErrors } from '@/lib/assetRegister';
import useFieldErrors from '@/hooks/useFieldErrors';
import { createAsset, isAssetIdTaken } from '@/lib/assetRegisterApi';
import AssetDetailsFields from './AssetDetailsFields';
import AdditionalDetailsFields from './AdditionalDetailsFields';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

export default function AddAssetPane({ isOpen, onClose, register, items, onSaved }) {
  const [form, setForm] = useState(emptyAsset());
  const [idError, setIdError] = useState('');

  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState(form);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose, saving, enabled: isOpen, subject: 'asset changes',
  });
  const fe = useFieldErrors(assetErrors, form);

  useEffect(() => {
    if (!isOpen) return;
    const init = { ...emptyAsset(), asset_id: nextAssetId(items) };
    setForm(init); setBaseline(init);
    setIdError(''); fe.reset(); setSaving(false);
  }, [isOpen]); // eslint-disable-line

  const set = (k, v) => { if (k === 'asset_id') setIdError(''); setForm((f) => ({ ...f, [k]: v })); };

  const checkId = async () => {
    if (!form.asset_id.trim()) return setIdError('Asset ID is required.');
    const taken = await isAssetIdTaken(register.id, form.asset_id);
    setIdError(taken ? 'This Asset ID is already in use in this register.' : '');
  };

  const handleSave = guardSave(setSaving, async () => {
    if (!fe.check()) return;
    setSaving(true);
    if (await isAssetIdTaken(register.id, form.asset_id)) {
      setSaving(false);
      return setIdError('This Asset ID is already in use in this register.');
    }
    await createAsset(register.id, form);
    await onSaved();
    setBaseline(form);
    setSaving(false);
    onClose();
  });

  return (
    <>
    {dialog}
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="bg-card h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Add Asset</h2>
          <CloseButton onClick={() => requestClose()} />
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <section className="rounded-xl bg-muted p-5 [&_input]:bg-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Asset Details</p>
            <AssetDetailsFields values={form} set={set} edit options={getAssetOptions(register)} idError={idError} onIdBlur={checkId} descriptionToggle errors={fe.errors} />
          </section>
          <section className="rounded-xl bg-muted p-5 [&_input]:bg-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Additional Details</p>
            <AdditionalDetailsFields values={form} set={set} edit />
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</> : 'Add Asset'}
          </Button>
        </div>
      </div>
    </SlidePane>
    </>
  );
}