import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import ModalOverlay from '@/components/ui/ModalOverlay';
import CloseButton from '@/components/shared/CloseButton';
import SlidePane from '@/components/ui/SlidePane';
import SectionCard from '@/components/shared/SectionCard';
import { useToast } from '@/components/ui/use-toast';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import DeliverableFormFields from './DeliverableFormFields';
import { useDeliverablesApi } from '@/lib/programs/deliverableApiContext';

const EMPTY = {
  title: '', description: '', owner: '', status: '', health: '', priority: '',
  track_enabled: true, track_method: 'completion', unit: '#', direction: 'Higher is Better', custom_fields: {},
};
const FIELDS = Object.keys(EMPTY);
const pick = (o) => Object.fromEntries(FIELDS.map((k) => [k, o?.[k] ?? EMPTY[k]]));

/** Add / edit a Program or Project Deliverable (owner comes from the deliverable API context). */
export default function DeliverableFormModal({ isOpen, onClose, ownerId, deliverable, config, onSaved }) {
  const { toast } = useToast();
  const api = useDeliverablesApi();
  const baseline = useMemo(() => pick(deliverable), [deliverable]);
  const [form, setForm] = useState(baseline);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (isOpen) { setForm(baseline); setErrors({}); } }, [isOpen, baseline]);
  const set = (k) => (v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: undefined })); };

  const save = async () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Name is required';
    if (!form.status) e.status = 'Status is required';
    if (!form.health) e.health = 'Health is required';
    if (Object.keys(e).length) { setErrors(e); return; }
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim() };
      if (deliverable) await api.update(deliverable.id, payload);
      else await api.create(ownerId, payload);
      toast({ title: deliverable ? 'Deliverable updated' : 'Deliverable added' });
      await onSaved?.();
      onClose();
    } catch (err) {
      toast({ title: 'Could not save', description: err?.message || 'Something went wrong', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const guard = useUnsavedChanges({ draft: form, baseline, onClose, saving, enabled: isOpen });

  if (!deliverable) {
    const close = () => guard.requestClose();
    return (
      <SlidePane isOpen={isOpen} onClose={close}>
        {guard.dialog}
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Add New Deliverable</h2>
            <CloseButton onClick={close} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            <SectionCard title="Deliverable Details">
              <DeliverableFormFields form={form} set={set} errors={errors} config={config} sections={['details']} compact />
            </SectionCard>
            <SectionCard title="Tracking and Monitoring Details">
              <DeliverableFormFields form={form} set={set} errors={errors} config={config} sections={['tracking']} compact />
            </SectionCard>
          </div>
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <Button variant="outline" onClick={close}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create Deliverable'}</Button>
          </div>
        </div>
      </SlidePane>
    );
  }

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-[40rem]">
      <div className="bg-card rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between px-6 pt-5 pb-4 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-foreground">{deliverable ? 'Edit Deliverable' : 'Add New Deliverable'}</h2>
            <p className="text-sm text-muted-foreground mt-0.5">{deliverable ? 'Update this deliverable and its details.' : `Create a new deliverable for this ${api.owner.kind}.`}</p>
          </div>
          <CloseButton onClick={() => guard.requestClose()} className="ml-4 mt-0.5" />
        </div>
        <div className="px-6 pb-5 overflow-y-auto">
          <DeliverableFormFields form={form} set={set} errors={errors} config={config} />
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <Button variant="outline" onClick={() => guard.requestClose()}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : deliverable ? 'Save Changes' : 'Save'}</Button>
        </div>
      </div>
      {guard.dialog}
    </ModalOverlay>
  );
}