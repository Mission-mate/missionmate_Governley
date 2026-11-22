import React, { useState, useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { base44 } from '@/api/base44Client';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import FieldError from '@/components/shared/FieldError';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SlidePane from '@/components/ui/SlidePane';
import DateField from '@/components/ui/DateField';
import SectionCard from '@/components/shared/SectionCard';
import ColoredSelect from '@/components/shared/ColoredSelect';
import CloseButton from '@/components/shared/CloseButton';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import { FieldLabel, ColorPicker } from '@/components/programs/CreateProgramModal';
import { cn } from '@/lib/utils';
import { createPlanner } from '@/lib/programs/plannerSources';

const STATUS_OPTIONS = [
  { value: 'active', name: 'Active', color: 'green' },
  { value: 'completed', name: 'Completed', color: 'blue' },
];
const ARCHIVED_OPTION = { value: 'archived', name: 'Archived', color: 'red' };
const FIELDS = ['title', 'description', 'owner', 'date_created', 'status', 'color'];

const validate = (f) => {
  const e = {};
  if (!f.title.trim()) e.title = 'Planner title is required.';
  if (!f.owner.trim()) e.owner = 'Planner owner is required.';
  return e;
};

export default function PlannerFormPane({ isOpen, onClose: closeNow, onSaved, source, ownerId, initialData = null }) {
  const empty = () => ({ title: '', description: '', owner: '', date_created: format(new Date(), 'yyyy-MM-dd'), status: 'active', color: 'blue' });
  const [form, setForm] = useState(empty);
  const [baseline, setBaseline] = useState(empty);
  const [showDescription, setShowDescription] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  // One key per create attempt: retrying after a failure resumes the same planner instead of adding another.
  const setupKey = useRef(null);
  const { errors, check, reset } = useFieldErrors(validate, form);
  const { requestClose, dialog } = useUnsavedChanges({ draft: form, baseline, onClose: closeNow, saving, enabled: isOpen, subject: 'planner changes' });

  useEffect(() => {
    if (!isOpen) return;
    const base = empty();
    const init = initialData ? Object.fromEntries(FIELDS.map(k => [k, initialData[k] ?? base[k]])) : base;
    setForm(init); setBaseline(init);
    setShowDescription(!!init.description);
    setSaveError('');
    setupKey.current = crypto.randomUUID();
    reset();
  }, [isOpen, initialData]); // eslint-disable-line

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const statusOptions = baseline.status === 'archived' ? [...STATUS_OPTIONS, ARCHIVED_OPTION] : STATUS_OPTIONS;
  const statusName = statusOptions.find(o => o.value === form.status)?.name || '';
  const isEdit = !!initialData?.id;

  const handleSubmit = async () => {
    if (!check()) return;
    setSaving(true);
    setSaveError('');
    const data = { ...form, title: form.title.trim(), owner: form.owner.trim() };
    try {
      if (isEdit) await base44.entities[source.entity].update(initialData.id, data);
      else await createPlanner(source, ownerId, setupKey.current, data);
    } catch {
      setSaveError(isEdit
        ? 'Your changes couldn’t be saved. Check your connection and try again.'
        : 'Your planner couldn’t be fully set up. Try again to finish setting it up — no duplicate will be created.');
      setSaving(false);
      return;
    }
    setSaving(false);
    onSaved();
    closeNow();
  };

  const inputCls = (err) => cn('bg-background', err && 'border-destructive focus-visible:ring-destructive');

  return (
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      {dialog}
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Planner Details' : 'Create Planner'}</h2>
          <CloseButton onClick={requestClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <SectionCard title="Planner Details">
            <div>
              <FieldLabel required error={errors.title}>Planner Title</FieldLabel>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Q3 Delivery Plan" className={inputCls(errors.title)} />
              <FieldError msg={errors.title} />
            </div>
            {showDescription ? (
              <div className="mt-4">
                <FieldLabel>Planner Description</FieldLabel>
                <AutoGrowTextarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the planner" autoFocus
                  className="w-full min-h-[72px] rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
              </div>
            ) : (
              <button type="button" onClick={() => setShowDescription(true)} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80">
                <Plus className="w-3.5 h-3.5" /> Add Description
              </button>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
              <div>
                <FieldLabel required error={errors.owner}>Planner Owner</FieldLabel>
                <Input value={form.owner} onChange={e => set('owner', e.target.value)} placeholder="e.g., Jane Smith" className={inputCls(errors.owner)} />
                <FieldError msg={errors.owner} />
              </div>
              <div>
                <FieldLabel>Date Created</FieldLabel>
                <DateField value={form.date_created} onChange={v => set('date_created', v)} inputClassName="bg-background" />
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <ColoredSelect value={statusName} allowClear={false} className="bg-background"
                  options={statusOptions} onChange={name => set('status', statusOptions.find(o => o.name === name)?.value || 'active')} />
              </div>
              <div>
                <FieldLabel>Planner Colour</FieldLabel>
                <ColorPicker value={form.color} onChange={v => set('color', v)} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="px-5 py-4 border-t border-border shrink-0">
          {saveError && <p role="alert" className="text-sm text-destructive mb-3">{saveError}</p>}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={requestClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (isEdit ? 'Saving...' : 'Setting up...') : saveError ? 'Try again' : isEdit ? 'Save Changes' : 'Create Planner'}
            </Button>
          </div>
        </div>
      </div>
    </SlidePane>
  );
}