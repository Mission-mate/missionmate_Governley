import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Plus } from 'lucide-react';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { SYSTEM_CREDENTIAL_TYPES, getCustomCredentialTypes, saveCredentialTypes, countCredentialsOfType } from '@/lib/workforceRegister';
import CredentialTypeRow from './CredentialTypeRow';

const Heading = ({ children }) => <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{children}</p>;

/** Configure the register's credential types (system types are locked). */
export default function ManageCredentialsPane({ isOpen, onClose, register, onSaved }) {
  const [draft, setDraft] = useState([]);
  const [freshId, setFreshId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const baseline = getCustomCredentialTypes(register);
  const { requestClose, dialog } = useUnsavedChanges({ draft, baseline, onClose, saving, enabled: isOpen, subject: 'credential type changes' });

  useEffect(() => { if (isOpen) { setDraft(baseline); setError(''); setFreshId(null); } }, [isOpen]); // eslint-disable-line

  const addType = () => { const id = `ct_${Date.now()}`; setDraft((d) => [...d, { id, name: '' }]); setFreshId(id); };
  const rename = (id, name) => setDraft((d) => d.map((t) => (t.id === id ? { ...t, name } : t)));
  const askDelete = async (t) => {
    if (!t.name) return setDraft((d) => d.filter((x) => x.id !== t.id));
    const saved = baseline.find((b) => b.id === t.id);
    const count = saved ? await countCredentialsOfType(register.id, saved.name) : 0;
    setPendingDelete({ ...t, count });
  };

  const handleSave = guardSave(setSaving, async () => {
    const clean = draft.map((t) => ({ ...t, name: t.name.trim() })).filter((t) => t.name);
    const names = [...SYSTEM_CREDENTIAL_TYPES, ...clean.map((t) => t.name)].map((n) => n.toLowerCase());
    if (new Set(names).size !== names.length) return setError('Credential type names must be unique.');
    setSaving(true);
    await saveCredentialTypes(register, clean);
    await onSaved();
    setSaving(false);
    onClose();
  });

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border shrink-0">
            <div>
              <h2 className="text-base font-semibold text-foreground">Manage Credentials</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Credential types people can hold. New types appear in the Credential filter and grouping straight away.</p>
            </div>
            <CloseButton onClick={requestClose} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <Heading>System Credentials</Heading>
              <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">System credentials (🔒) cannot be deleted.</p>
              <div className="space-y-2">{SYSTEM_CREDENTIAL_TYPES.map((n) => <CredentialTypeRow key={n} name={n} locked />)}</div>
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <Heading>Custom Credentials</Heading>
                <Button variant="outline" size="sm" onClick={addType} className="shrink-0"><Plus className="w-3.5 h-3.5" /> New Credential Type</Button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">Renaming a type updates existing credentials.</p>
              {draft.length === 0 ? (
                <div className="rounded-lg bg-muted/40 px-4 py-4 text-sm text-muted-foreground text-center">No custom credential types yet. Use "+ New Credential Type" to create one.</div>
              ) : (
                <div className="space-y-2">
                  {draft.map((t) => <CredentialTypeRow key={t.id} name={t.name} startEditing={t.id === freshId} onRename={(n) => rename(t.id, n)} onDelete={() => askDelete(t)} />)}
                </div>
              )}
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
            <Button variant="outline" onClick={requestClose}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Configuration'}</Button>
          </div>
        </div>
      </SlidePane>
      <ConfirmTypeDialog isOpen={!!pendingDelete} title="Delete Credential Type" confirmLabel="Delete" onClose={() => setPendingDelete(null)}
        message={pendingDelete && `"${pendingDelete.name}" is linked to ${pendingDelete.count} credential${pendingDelete.count === 1 ? '' : 's'}. Deleting removes it from future choices; existing credentials stay unchanged. Type DELETE to confirm.`}
        onConfirm={() => { setDraft((d) => d.filter((x) => x.id !== pendingDelete.id)); setPendingDelete(null); }} />
      {dialog}
    </>
  );
}