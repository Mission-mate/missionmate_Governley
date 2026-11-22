import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import SlidePane from '@/components/ui/SlidePane';
import SectionCard from '@/components/shared/SectionCard';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';

// Slide-in pane for editing the Internal Lead and Key Contacts only.
export default function EditKeyContactsPane({ isOpen, onClose: closeNow, grant, onSave }) {
  const [form, setForm] = useState({ internal_owner: '', internal_owner_role: '', provider_contacts: [] });
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState(form);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen, subject: 'key contact changes',
  });
  const onClose = () => requestClose();
  const setInitial = (init) => { setForm(init); setBaseline(init); };

  useEffect(() => {
    if (isOpen && grant) {
      setInitial({
        internal_owner: grant.internal_owner || '',
        internal_owner_role: grant.internal_owner_role || '',
        provider_contacts: grant.provider_contacts ? JSON.parse(JSON.stringify(grant.provider_contacts)) : [],
      });
    }
  }, [isOpen, grant]);

  const handleSave = async () => {
    setSaving(true);
    await onSave({ ...form });
    setSaving(false);
    closeNow();
  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
          <div className="w-full bg-white shadow-2xl flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
              <h2 className="text-lg font-bold text-foreground">Manage Key Contacts</h2>
              <PaneIconHeaderActions showEdit={false} onClose={onClose} />
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              <SectionCard title="Internal Lead">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <Input className="bg-white" value={form.internal_owner || ''} onChange={e => setForm(p => ({ ...p, internal_owner: e.target.value }))} placeholder="e.g., James Dawson" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                    <Input className="bg-white" value={form.internal_owner_role || ''} onChange={e => setForm(p => ({ ...p, internal_owner_role: e.target.value }))} placeholder="e.g. Program Manager" />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Key Contacts">
                <div className="space-y-4">
                  {(form.provider_contacts || []).map((c, i) => (
                    <div key={i} className="bg-white border border-border rounded-lg p-3 space-y-3 relative">
                      <button
                        onClick={() => setForm(p => ({ ...p, provider_contacts: p.provider_contacts.filter((_, idx) => idx !== i) }))}
                        className="absolute top-2 right-2 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                          <Input
                            className="bg-white"
                            value={c.role || ''}
                            onChange={e => setForm(p => { const contacts = [...p.provider_contacts]; contacts[i] = { ...contacts[i], role: e.target.value }; return { ...p, provider_contacts: contacts }; })}
                            placeholder="e.g. Grant Officer"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Name</label>
                          <Input
                            className="bg-white"
                            value={c.name || ''}
                            onChange={e => setForm(p => { const contacts = [...p.provider_contacts]; contacts[i] = { ...contacts[i], name: e.target.value }; return { ...p, provider_contacts: contacts }; })}
                            placeholder="E.g., Jane Doe"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email</label>
                          <Input
                            className="bg-white"
                            value={c.email || ''}
                            onChange={e => setForm(p => { const contacts = [...p.provider_contacts]; contacts[i] = { ...contacts[i], email: e.target.value }; return { ...p, provider_contacts: contacts }; })}
                            placeholder="E.g., Jane.doe@mission.com"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone</label>
                          <Input
                            className="bg-white"
                            value={c.phone || ''}
                            onChange={e => setForm(p => { const contacts = [...p.provider_contacts]; contacts[i] = { ...contacts[i], phone: e.target.value }; return { ...p, provider_contacts: contacts }; })}
                            placeholder="E.g., (02) 5550 1234"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={() => setForm(p => ({ ...p, provider_contacts: [...(p.provider_contacts || []), { role: '', name: '', email: '', phone: '' }] }))}
                    className="w-full flex items-center justify-center gap-1.5 bg-white border border-border rounded-lg py-2 text-sm text-muted-foreground shadow-[0_1px_3px_rgba(16,24,40,0.08),0_1px_2px_rgba(16,24,40,0.06)] hover:text-foreground hover:shadow-[0_2px_6px_rgba(16,24,40,0.12)] transition-all"
                  >
                    <Plus className="w-4 h-4" /> Add Contact
                  </button>
                </div>
              </SectionCard>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              <EditFooterActions dirty={!draftEqual(form, baseline)} onCancel={onClose}
                onSave={handleSave} saving={saving} saveDisabled={!(form.internal_owner || '').trim()} />
            </div>
          </div>
    </SlidePane>
  );
}