import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { ExternalLink } from 'lucide-react';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import FieldError from '@/components/shared/FieldError';
import GiftField from '@/components/compliance/gifts/GiftField';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import CredentialTypeSelect from './CredentialTypeSelect';
import {
  emptyCredential, pickCredential, saveCredential, credentialTypeNames, credentialErrors, validityOf,
  VERIFICATION_OPTIONS, STATUS_OPTIONS, VALIDITY_OPTIONS,
} from '@/lib/workforceRegister';

function Toggle({ label, checked, onChange, edit }) {
  return <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={!!checked} onCheckedChange={onChange} disabled={!edit} /> {label}</label>;
}

/**
 * Add (credential = null) or view/edit one credential of a person.
 * With `onOpen` the pane is view only and the header shows an Open action instead of Edit.
 */
export default function CredentialPane({ isOpen, onClose, register, personId, personName, credential, startInEdit, onSaved, onOpen }) {
  const isNew = !credential;
  const [form, setForm] = useState(emptyCredential());
  const [baseline, setBaseline] = useState(form);
  const [edit, setEdit] = useState(false);
  const { errors, check, reset } = useFieldErrors(credentialErrors, form);
  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({ draft: form, baseline, onClose, saving, enabled: isOpen, subject: 'credential changes' });

  useEffect(() => {
    if (!isOpen) return;
    const init = isNew ? emptyCredential() : pickCredential(credential);
    setForm(init); setBaseline(init); setEdit(!onOpen && (isNew || !!startInEdit)); reset(); setSaving(false);
  }, [isOpen, credential?.id, startInEdit]); // eslint-disable-line

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const handleSave = guardSave(setSaving, async () => {
    if (!check()) return;
    setSaving(true);
    await saveCredential(register.id, personId, form, baseline.status);
    await onSaved();
    setBaseline(form); setSaving(false);
    if (isNew) onClose(); else setEdit(false);
  });
  const dirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const p = { values: form, set, edit, errors };

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground truncate">{isNew ? 'Add Credential' : baseline.credential_name}</h2>
              <PaneIconHeaderActions showEdit={!isNew && !edit} onEdit={() => setEdit(true)} onOpen={onOpen} onClose={() => requestClose()} />
            </div>
            {personName && <p className="text-sm font-medium text-muted-foreground truncate">{personName}</p>}
            {onOpen
              ? !edit && <ViewModeHint className="mt-1.5" icon={ExternalLink} action="open" />
              : !isNew && <ViewModeHint className="mt-1.5" editing={edit} />}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
            <section className="rounded-xl bg-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Credential Details</p>
              <div className="grid grid-cols-2 gap-4">
                {edit ? (
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Credential<span className="text-destructive"> *</span></Label>
                    <CredentialTypeSelect value={form.credential_name} onChange={(v) => set('credential_name', v)} options={credentialTypeNames(register)} error={!!errors.credential_name} />
                    <FieldError msg={errors.credential_name} />
                    {isNew && <p className="text-xs text-muted-foreground">Missing a credential type? Add it under Manage Credentials.</p>}
                  </div>
                ) : <GiftField {...p} k="credential_name" label="Credential *" full />}
                <GiftField {...p} k="reference_number" label="Card or Certificate No." placeholder="e.g., 12348123" />
                <GiftField {...p} k="jurisdiction" label="Jurisdiction" placeholder="e.g., National or State/Territory" />
                <GiftField {...p} k="issue_date" label="Issue Date" type="date" />
                {!form.no_expiry && <GiftField {...p} k="expiry_date" label="Expiry Date" type="date" />}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Validity</Label>
                  <div><AssetBadge value={validityOf(form)} options={VALIDITY_OPTIONS} /></div>
                  {edit && <p className="text-[11px] text-muted-foreground">Calculated from the expiry date</p>}
                </div>
                <GiftField {...p} k="status" label="Status *" type="select" options={STATUS_OPTIONS} colored required />
                <div className="col-span-2 flex flex-wrap gap-6">
                  <Toggle label="No expiry" checked={form.no_expiry} onChange={(v) => set('no_expiry', v)} edit={edit} />
                  <Toggle label="Restricted (hide number)" checked={form.restricted} onChange={(v) => set('restricted', v)} edit={edit} />
                </div>
              </div>
            </section>
            <section className="rounded-xl bg-muted p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Verification</p>
              <div className="grid grid-cols-2 gap-4">
                <GiftField {...p} k="verification_status" label="Verification" type="select" options={VERIFICATION_OPTIONS} colored required />
                <GiftField {...p} k="verified_by" label="Verified By" type={edit ? 'text' : 'person'} placeholder="e.g., Priya Nair" />
                <GiftField {...p} k="verified_date" label="Date Verified" type="date" />
                <GiftField {...p} k="note" label="Additional Notes" type="long" full placeholder="Any additional information about this credential" />
              </div>
            </section>
          </div>
          {edit && (
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={isNew || dirty} onSave={handleSave} saving={saving}
                onCancel={() => (isNew ? requestClose() : (setForm(baseline), reset(), setEdit(false)))} saveLabel={isNew ? 'Add Credential' : undefined} />
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}