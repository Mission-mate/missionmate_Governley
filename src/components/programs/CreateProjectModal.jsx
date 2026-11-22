import React, { useState, useEffect } from 'react';
import { Plus, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useFieldErrors from '@/hooks/useFieldErrors';
import FieldError from '@/components/shared/FieldError';
import { useToast } from '@/components/ui/use-toast';
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

const STATUS_OPTIONS = [
  { value: 'active', name: 'Active', color: 'green' },
  { value: 'completed', name: 'Completed', color: 'blue' },
];
const ARCHIVED_OPTION = { value: 'archived', name: 'Archived', color: 'red' };
const KEYS = ['title', 'description', 'project_manager', 'project_officer', 'status', 'color', 'start_date', 'end_date', 'program_id', 'program_title'];

const emptyForm = (program) => ({
  title: '', description: '', project_manager: '', project_officer: '', status: 'active', color: 'blue',
  start_date: '', end_date: '', program_id: program?.id || '', program_title: program?.title || '',
});

const validate = (f) => {
  const e = {};
  if (!f.title.trim()) e.title = 'Project title is required.';
  if (!f.program_id) e.program_id = 'Program link is required.';
  if (!f.status) e.status = 'Status is required.';
  if (!f.color) e.color = 'Project colour is required.';
  if (!f.start_date) e.start_date = 'Project start date is required.';
  if (!(f.project_manager || '').trim()) e.project_manager = 'Project manager is required.';
  if (f.start_date && f.end_date && f.end_date < f.start_date) e.end_date = 'End date must be on or after the start date.';
  return e;
};

/** Create / edit a Project inside a Program. Program Linked is preset and locked. */
export default function CreateProjectModal({ isOpen, onClose: closeNow, onSaved, program, initialData = null }) {
  const [form, setForm] = useState(emptyForm(program));
  const [baseline, setBaseline] = useState(form);
  const [showDescription, setShowDescription] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { errors, check, reset } = useFieldErrors(validate, form);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen, subject: 'project changes',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (!isOpen) return;
    const base = emptyForm(program);
    const init = initialData ? Object.fromEntries(KEYS.map(k => [k, initialData[k] ?? base[k]])) : base;
    // The linked program's current title wins over the copy saved on the project.
    if (program?.title) init.program_title = program.title;
    setForm(init); setBaseline(init);
    setShowDescription(!!init.description);
    reset();
  }, [isOpen, initialData, program]); // eslint-disable-line

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const statusOptions = baseline.status === 'archived' ? [...STATUS_OPTIONS, ARCHIVED_OPTION] : STATUS_OPTIONS;
  const statusName = statusOptions.find(o => o.value === form.status)?.name || '';

  const handleSubmit = async () => {
    if (!check()) return;
    setSaving(true);
    const data = { ...form, title: form.title.trim(), project_manager: form.project_manager.trim(), project_officer: form.project_officer.trim() };
    try {
      if (initialData?.id) await base44.entities.Project.update(initialData.id, data);
      else await base44.entities.Project.create(data);
    } catch (err) {
      toast({ title: 'Could not save', description: err?.message || 'Something went wrong', variant: 'destructive' });
      return;
    } finally {
      setSaving(false);
    }
    onSaved?.();
    closeNow();
  };

  const isEdit = !!initialData?.id;
  const inputCls = (err) => cn('bg-background', err && 'border-destructive focus-visible:ring-destructive');
  const dateWrap = (err) => cn(err && 'rounded-md ring-1 ring-destructive');

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Project' : 'Create New Project'}</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <SectionCard title="Project Details">
            <div>
              <FieldLabel required error={errors.title}>Project Title</FieldLabel>
              <Input autoFocus value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Community Workshop for Youth" className={inputCls(errors.title)} />
              <FieldError msg={errors.title} />
            </div>
            {showDescription ? (
              <div className="mt-4">
                <FieldLabel>Project Description</FieldLabel>
                <AutoGrowTextarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the project" autoFocus
                  className="w-full min-h-[72px] rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
              </div>
            ) : (
              <button type="button" onClick={() => setShowDescription(true)} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80">
                <Plus className="w-3.5 h-3.5" /> Add Description
              </button>
            )}
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
              <div className="col-span-2">
                <FieldLabel required error={errors.program_id}>Program Linked</FieldLabel>
                <div className="relative">
                  <Input disabled readOnly value={form.program_title || ''} className="bg-muted text-muted-foreground pr-8 disabled:opacity-100" />
                  <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <FieldError msg={errors.program_id} />
              </div>
              <div>
                <FieldLabel required error={errors.status}>Status</FieldLabel>
                <ColoredSelect value={statusName} allowClear={false} invalid={!!errors.status} className="bg-background"
                  options={statusOptions} onChange={name => set('status', statusOptions.find(o => o.name === name)?.value || '')} />
                <FieldError msg={errors.status} />
              </div>
              <div>
                <FieldLabel required error={errors.color}>Project Colour</FieldLabel>
                <ColorPicker value={form.color} onChange={v => set('color', v)} invalid={!!errors.color} />
                <FieldError msg={errors.color} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Project Governance and Timeline" className="mt-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <FieldLabel required error={errors.start_date}>Project Start Date</FieldLabel>
                <div className={dateWrap(errors.start_date)}><DateField value={form.start_date} onChange={v => set('start_date', v)} inputClassName="bg-background" /></div>
                <FieldError msg={errors.start_date} />
              </div>
              <div>
                <FieldLabel error={errors.end_date} tip="Leave blank if the project doesn't have an end date.">Project End Date</FieldLabel>
                <div className={dateWrap(errors.end_date)}><DateField value={form.end_date} onChange={v => set('end_date', v)} inputClassName="bg-background" /></div>
                <FieldError msg={errors.end_date} />
              </div>
              <div>
                <FieldLabel required error={errors.project_manager}>Project Manager</FieldLabel>
                <Input value={form.project_manager} onChange={e => set('project_manager', e.target.value)} placeholder="e.g., Jane Smith" className={inputCls(errors.project_manager)} />
                <FieldError msg={errors.project_manager} />
              </div>
              <div>
                <FieldLabel>Project Officer</FieldLabel>
                <Input value={form.project_officer} onChange={e => set('project_officer', e.target.value)} placeholder="e.g., John Citizen" className="bg-background" />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}</Button>
        </div>
      </div>
    </SlidePane>
  );
}