import React, { useState, useEffect } from 'react';
import { Plus, Check, ChevronDown } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { saveProgram } from '@/lib/programs/programSave';
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
import InfoTooltip from '@/components/risk/InfoTooltip';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import { cn } from '@/lib/utils';

export const PROGRAM_COLORS = [
  { key: 'blue', label: 'Blue', dot: 'bg-blue-500' },
  { key: 'green', label: 'Green', dot: 'bg-green-500' },
  { key: 'purple', label: 'Purple', dot: 'bg-purple-500' },
  { key: 'orange', label: 'Orange', dot: 'bg-orange-500' },
  { key: 'pink', label: 'Pink', dot: 'bg-pink-500' },
  { key: 'teal', label: 'Teal', dot: 'bg-teal-500' },
];

const STATUS_OPTIONS = [
  { value: 'active', name: 'Active', color: 'green' },
  { value: 'completed', name: 'Completed', color: 'blue' },
];
const ARCHIVED_OPTION = { value: 'archived', name: 'Archived', color: 'red' };

const EMPTY = { title: '', description: '', color: 'blue', start_date: '', end_date: '', program_lead: '', executive_sponsor: '', status: 'active' };

const validate = (f) => {
  const e = {};
  if (!f.title.trim()) e.title = 'Program title is required.';
  if (!f.status) e.status = 'Status is required.';
  if (!f.color) e.color = 'Program colour is required.';
  if (!f.start_date) e.start_date = 'Program start date is required.';
  if (!(f.program_lead || '').trim()) e.program_lead = 'Program manager is required.';
  if (f.start_date && f.end_date && f.end_date < f.start_date) e.end_date = 'End date must be on or after the start date.';
  return e;
};

export function FieldLabel({ children, required, error, tip }) {
  return (
    <label className={cn('mb-1.5 flex items-center gap-1 text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}{required && <span className="text-destructive">*</span>}
      {tip && <InfoTooltip text={tip} />}
    </label>
  );
}

export function ColorPicker({ value, onChange, invalid }) {
  const [open, setOpen] = useState(false);
  const current = PROGRAM_COLORS.find(c => c.key === value) || PROGRAM_COLORS[0];
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(v => !v)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={cn('w-full flex items-center justify-between border rounded-md px-3 h-9 text-sm bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring', invalid ? 'border-destructive' : 'border-input')}>
        <span className="flex items-center gap-2"><span className={cn('w-3.5 h-3.5 rounded-full', current.dot)} />{current.label}</span>
        <ChevronDown className="w-4 h-4 opacity-50" />
      </button>
      {open && (
        <div className="animate-dropdown-enter absolute top-full mt-1 left-0 right-0 bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 p-1">
          {PROGRAM_COLORS.map(c => (
            <button key={c.key} type="button" onMouseDown={() => { onChange(c.key); setOpen(false); }}
              className="flex items-center justify-between w-full px-2 py-1.5 rounded-sm text-sm hover:bg-accent hover:text-accent-foreground transition-colors">
              <span className="flex items-center gap-2"><span className={cn('w-3.5 h-3.5 rounded-full', c.dot)} />{c.label}</span>
              {value === c.key && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateProgramModal({ isOpen, onClose: closeNow, onCreated, initialData = null }) {
  const [form, setForm] = useState(EMPTY);
  const [baseline, setBaseline] = useState(EMPTY);
  const [showDescription, setShowDescription] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const { errors, check, reset } = useFieldErrors(validate, form);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen, subject: 'program changes',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (!isOpen) return;
    const init = initialData
      ? Object.fromEntries(Object.keys(EMPTY).map(k => [k, initialData[k] ?? EMPTY[k]]))
      : EMPTY;
    setForm(init); setBaseline(init);
    setShowDescription(!!init.description);
    reset();
  }, [isOpen, initialData]); // eslint-disable-line

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));
  const statusOptions = form.status === 'archived' || baseline.status === 'archived' ? [...STATUS_OPTIONS, ARCHIVED_OPTION] : STATUS_OPTIONS;
  const statusName = statusOptions.find(o => o.value === form.status)?.name || '';

  const handleSubmit = async () => {
    if (!check()) return;
    setSaving(true);
    const data = { ...form, title: form.title.trim(), program_lead: form.program_lead.trim(), program_lead_id: '' };
    try {
      if (initialData?.id) await saveProgram(initialData.id, data);
      else await base44.entities.Program.create(data);
    } catch (err) {
      toast({ title: 'Could not save', description: err?.message || 'Something went wrong', variant: 'destructive' });
      return;
    } finally {
      setSaving(false);
    }
    onCreated();
    closeNow();
  };

  const isEdit = !!initialData?.id;
  const inputCls = (err) => cn('bg-background', err && 'border-destructive focus-visible:ring-destructive');

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border shrink-0 flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">{isEdit ? 'Edit Program' : 'Create New Program'}</h2>
          <CloseButton onClick={onClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <SectionCard title="Program Details">
            <div>
              <FieldLabel required error={errors.title}>Program Title</FieldLabel>
              <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="e.g. Community Outreach 2026" className={inputCls(errors.title)} />
              <FieldError msg={errors.title} />
            </div>
            {showDescription ? (
              <div className="mt-4">
                <FieldLabel>Program Description</FieldLabel>
                <AutoGrowTextarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of the program" autoFocus
                  className="w-full min-h-[72px] rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
              </div>
            ) : (
              <button type="button" onClick={() => setShowDescription(true)} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80">
                <Plus className="w-3.5 h-3.5" /> Add Description
              </button>
            )}

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
              <div>
                <FieldLabel required error={errors.status}>Status</FieldLabel>
                <ColoredSelect value={statusName} allowClear={false} invalid={!!errors.status} className="bg-background"
                  options={statusOptions} onChange={name => set('status', statusOptions.find(o => o.name === name)?.value || '')} />
                <FieldError msg={errors.status} />
              </div>
              <div>
                <FieldLabel required error={errors.color}>Program Colour</FieldLabel>
                <ColorPicker value={form.color} onChange={v => set('color', v)} invalid={!!errors.color} />
                <FieldError msg={errors.color} />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Program Governance and Timeline" className="mt-4">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <FieldLabel required error={errors.program_lead}>Program Manager</FieldLabel>
                <Input value={form.program_lead} onChange={e => set('program_lead', e.target.value)} placeholder="e.g., Jane Smith" className={inputCls(errors.program_lead)} />
                <FieldError msg={errors.program_lead} />
              </div>
              <div>
                <FieldLabel tip="Senior Executive responsible for overseeing the program">Executive Sponsor</FieldLabel>
                <Input value={form.executive_sponsor} onChange={e => set('executive_sponsor', e.target.value)} placeholder="e.g., Deputy Chief Executive" className="bg-background" />
              </div>
              <div>
                <FieldLabel required error={errors.start_date}>Program Start Date</FieldLabel>
                <div className={cn(errors.start_date && 'rounded-md ring-1 ring-destructive')}>
                  <DateField value={form.start_date} onChange={v => set('start_date', v)} inputClassName="bg-background" />
                </div>
                <FieldError msg={errors.start_date} />
              </div>
              <div>
                <FieldLabel error={errors.end_date} tip="Leave blank if the program doesn't have an end date.">Program End Date</FieldLabel>
                <div className={cn(errors.end_date && 'rounded-md ring-1 ring-destructive')}>
                  <DateField value={form.end_date} onChange={v => set('end_date', v)} inputClassName="bg-background" />
                </div>
                <FieldError msg={errors.end_date} />
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>{saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Program'}</Button>
        </div>
      </div>
    </SlidePane>
  );
}