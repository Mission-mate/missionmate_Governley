import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import StaffPaneHeader from './StaffPaneHeader';
import StaffStepper from './StaffStepper';
import StaffDetailsStep from './StaffDetailsStep';
import StaffPermissionsStep from './StaffPermissionsStep';
import { buildPermissionsMap } from '@/lib/permissions';

/** Team member pane — opens in view mode (or edit mode with startInEdit); the Edit icon switches the same two-step layout to editable. */
export default function StaffMemberPane({ member, startInEdit = false, onClose: closeNow, onSave, onSendInvite }) {
  const [form, setForm] = useState(null);
  const [step, setStep] = useState(1);
  const [readOnly, setReadOnly] = useState(true);
  const [loading, setLoading] = useState(false);
  const [baseline, setBaseline] = useState(null);
  const open = !!member;
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving: loading,
    enabled: open && !!form && !readOnly, subject: 'team member changes',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (!member) return;
    const access = member.access_control || 'full';
    const init = {
      ...member,
      access_control: access,
      permissions: access === 'full' ? buildPermissionsMap(true) : { ...(member.permissions || {}) },
    };
    setForm(init); setBaseline(init);
    setStep(1); setReadOnly(!startInEdit);
  }, [member, startInEdit]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  const setSelect = (field) => (val) => setForm((f) => ({ ...f, [field]: val }));

  const handleAccessControlChange = (val) => {
    setForm((f) => ({
      ...f,
      access_control: val,
      permissions: val === 'full' ? buildPermissionsMap(true) : { ...(f.permissions || {}) },
    }));
  };

  const handleToggle = (mod, child, value) => {
    const key = child ? `${mod.id}.${child.id}` : mod.id;
    setForm((f) => {
      const next = { ...(f.permissions || {}), [key]: value };
      // Toggling a parent on/off applies to all its children too.
      if (!child && mod.children) {
        for (const c of mod.children) next[`${mod.id}.${c.id}`] = value;
      }
      // Turning a child on implies its parent module is accessible.
      if (child && value) next[mod.id] = true;
      return { ...f, permissions: next };
    });
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave({
      ...form,
      permissions: form.access_control === 'full' ? buildPermissionsMap(true) : form.permissions,
    });
    setLoading(false);
    closeNow();
  };

  return (
    <SlidePane isOpen={open && !!form} onClose={onClose}>
      {dialog}
      {form && (
      <div className="h-full bg-card border-l border-border flex flex-col">
        <StaffPaneHeader member={form} readOnly={readOnly} onEdit={() => setReadOnly(false)} onClose={onClose} />
        <StaffStepper step={step} onStep={setStep} />

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 ? (
            <StaffDetailsStep
              form={form}
              set={set}
              setSelect={setSelect}
              onSendInvite={() => onSendInvite(form)}
              readOnly={readOnly}
            />
          ) : (
            <StaffPermissionsStep
              accessControl={form.access_control}
              onAccessControlChange={handleAccessControlChange}
              permissions={form.permissions || {}}
              onToggle={handleToggle}
              readOnly={readOnly}
            />
          )}
        </div>

        <div className="border-t border-border px-6 py-4 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {step === 2 ? (
              <Button variant="outline" className="gap-1.5" onClick={() => setStep(1)}>
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            ) : (
              <Button variant="outline" onClick={onClose}>{readOnly ? 'Close' : 'Cancel'}</Button>
            )}
            {step === 1 ? (
              <Button className="gap-1.5" onClick={() => setStep(2)}>
                Next <ArrowRight className="w-4 h-4" />
              </Button>
            ) : !readOnly && (
              <Button onClick={handleSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
      )}
    </SlidePane>
  );
}