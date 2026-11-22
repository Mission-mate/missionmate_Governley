import React, { useState, useEffect } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import { Input } from '@/components/ui/input';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import DateField from '@/components/ui/DateField';
import SectionCard from '@/components/shared/SectionCard';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import GrantActivityHint from '@/components/grants/GrantActivityHint';
import GrantFieldCombobox from '@/components/grants/shared/GrantFieldCombobox';
import GrantStatusSelect from '@/components/grants/shared/GrantStatusSelect';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

// Right-side slide-in pane for editing core grant details.
export default function EditGrantPane({ isOpen, onClose: closeNow, grant, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState({});
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen, subject: 'grant changes',
  });
  const onClose = () => requestClose();
  const setInitial = (init) => { setForm(init); setBaseline(init); };

  useEffect(() => {
    if (isOpen && grant) {
      setInitial({
        name: grant.name || '',
        reference_id: grant.reference_id || '',
        description: grant.description || '',
        start_date: grant.start_date || '',
        end_date: grant.end_date || '',
        status: grant.status || 'active',
        provider: grant.provider || '',
        provider_id: grant.provider_id || '',
        program: grant.program || '',
        activity_id: grant.activity_id || ''
      });
    }
  }, [isOpen, grant]);

  const isValid = !!(form.name || '').trim() && !!(form.provider || '').trim() && !!(form.program || '').trim() && !!form.status && !!form.start_date && !!form.end_date;

  const handleSave = async () => {
    setSaving(true);
    // onSave reports success — a failed update must leave the pane open so the
    // user keeps their edits.
    const ok = await onSave({ ...form });
    setSaving(false);
    if (ok) closeNow();
  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <div className="w-full bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg font-bold text-foreground">Edit Grant Details</h2>
          <PaneIconHeaderActions showEdit={false} onClose={onClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Grant Details */}
          <SectionCard title="Grant Details">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Grant Reference ID</label>
                <Input className="bg-white" value={form.reference_id || ''} onChange={(e) => setForm((p) => ({ ...p, reference_id: e.target.value }))} placeholder="Enter reference ID" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Grant Title <span className="text-red-500">*</span></label>
                <Input className="bg-white" value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Enter grant name" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Grant Provider <span className="text-red-500">*</span></label>
                <GrantFieldCombobox
                  entity="GrantProvider"
                  entityLabel="grant funder"
                  value={form.provider || ''}
                  onSelect={({ id, name }) => setForm((p) => ({ ...p, provider: name, provider_id: id }))}
                  placeholder="Search or create a grant funder"
                  inputClassName="bg-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Grant Start Date <span className="text-red-500">*</span></label>
                  <DateField inputClassName="bg-white" value={form.start_date || ''} onChange={(v) => setForm((p) => ({ ...p, start_date: v }))} placeholder="DD/MM/YYYY" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1.5">Grant End Date <span className="text-red-500">*</span></label>
                  <DateField inputClassName="bg-white" value={form.end_date || ''} onChange={(v) => setForm((p) => ({ ...p, end_date: v }))} placeholder="DD/MM/YYYY" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Grant Status <span className="text-red-500">*</span></label>
                <GrantStatusSelect
                  value={form.status || 'active'}
                  onChange={(v) => setForm((p) => ({ ...p, status: v }))}
                  className="bg-white" />
              </div>
            </div>
          </SectionCard>

          {/* Grant Activity Details */}
          <SectionCard title="Grant Activity Details">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1.5">
                  Grant Activity Title <span className="text-red-500">*</span> <GrantActivityHint />
                </label>
                <GrantFieldCombobox
                  entity="GrantActivity"
                  entityLabel="activity"
                  value={form.program || ''}
                  onSelect={({ id, name }) => setForm((p) => ({ ...p, program: name, activity_id: id }))}
                  placeholder="Search or create an activity"
                  inputClassName="bg-white" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1.5">Description</label>
                <AutoGrowTextarea
                  value={form.description || ''}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Enter description..."
                  className="min-h-[80px]" />
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <EditFooterActions dirty={!draftEqual(form, baseline)} onCancel={onClose}
            onSave={handleSave} saving={saving} saveDisabled={!isValid} />
        </div>
      </div>
    </SlidePane>
  );
}