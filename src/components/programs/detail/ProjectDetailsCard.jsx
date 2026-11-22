import React, { useState } from 'react';
import { Calendar, Plus, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import SectionEditButton from '@/components/shared/SectionEditButton';
import CardEditFooter from '@/components/shared/CardEditFooter';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/shared/ColoredSelect';
import FieldError from '@/components/shared/FieldError';
import { useToast } from '@/components/ui/use-toast';
import DiscardChangesDialog from '@/components/shared/DiscardChangesDialog';
import LifecycleStatusPill from '@/components/programs/LifecycleStatusPill';
import { ColorPicker } from '@/components/programs/CreateProgramModal';
import ColorReadField from './ColorReadField';
import { fmtDate, ReadField, PersonField, FieldLabel as L, TIPS } from './overviewFields';

const STATUS = [
  { value: 'active', name: 'Active', color: 'green' },
  { value: 'completed', name: 'Completed', color: 'blue' },
];
const SECTIONS = {
  details: { title: 'Project Details', keys: ['title', 'description', 'status', 'color'] },
  governance: { title: 'Project Governance and Timeline', keys: ['start_date', 'end_date', 'project_manager', 'project_officer'] },
};

const validate = (d, section) => {
  const e = {};
  if (section === 'details') {
    if (!(d.title || '').trim()) e.title = 'Project title is required.';
  } else {
    if (!d.start_date) e.start_date = 'Project start date is required.';
    if (!(d.project_manager || '').trim()) e.project_manager = 'Project manager is required.';
    if (d.start_date && d.end_date && d.end_date < d.start_date) e.end_date = 'End date must be on or after the start date.';
  }
  return e;
};

/** One inline-editable section of a project's overview: 'details' or 'governance'. */
export default function ProjectDetailsCard({ project, programTitle, onUpdate, section = 'details', locked, onEditingChange }) {
  const { title, keys } = SECTIONS[section];
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const editing = !!draft;
  React.useEffect(() => { onEditingChange?.(editing); }, [editing]);
  const upd = (f) => setDraft((d) => ({ ...d, ...f }));
  const opts = project.status === 'archived' ? [...STATUS, { value: 'archived', name: 'Archived', color: 'red' }] : STATUS;

  const startEdit = () => { setErrors({}); setShowDesc(!!project.description); setDraft(Object.fromEntries(keys.map((k) => [k, project[k] || '']))); };
  const cancel = () => {
    const dirty = keys.some((k) => (draft[k] || '') !== (project[k] || ''));
    if (dirty) setConfirmDiscard(true); else setDraft(null);
  };

  const save = async () => {
    const e = validate(draft, section);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const data = { ...draft };
    if (section === 'details') { data.title = draft.title.trim(); data.color = draft.color || 'blue'; }
    else { data.project_manager = draft.project_manager.trim(); data.project_officer = draft.project_officer.trim(); }
    try {
      await base44.entities.Project.update(project.id, data);
    } catch (err) {
      toast({ title: 'Could not save', description: err?.message || 'Something went wrong', variant: 'destructive' });
      return;
    } finally {
      setSaving(false);
    }
    setDraft(null);
    onUpdate();
  };

  return (
    <div className={ELEVATED_SECTION}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-base">{title}</h3>
        {!editing && <SectionEditButton disabled={locked} onClick={startEdit} />}
      </div>
      {section === 'details' ? (
        editing ? (
          <div className="space-y-3">
            <div><L>Project Title</L><Input value={draft.title} onChange={(e) => upd({ title: e.target.value })} /><FieldError msg={errors.title} /></div>
            {showDesc ? (
              <div><L>Description</L><Textarea rows={3} autoFocus={!project.description} value={draft.description} onChange={(e) => upd({ description: e.target.value })} className="resize-none" /></div>
            ) : (
              <button type="button" onClick={() => setShowDesc(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"><Plus className="w-3.5 h-3.5" /> Add Description</button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><L>Program Linked</L>
                <div className="relative"><Input disabled readOnly value={programTitle || ''} className="bg-muted text-muted-foreground pr-8 disabled:opacity-100" />
                  <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" /></div>
              </div>
              <div><L>Status</L><ColoredSelect value={opts.find((o) => o.value === draft.status)?.name || ''} allowClear={false} options={opts} onChange={(n) => upd({ status: opts.find((o) => o.name === n)?.value })} /></div>
              <div><L>Project Colour</L><ColorPicker value={draft.color} onChange={(v) => upd({ color: v })} /></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ReadField label="Project Title">{project.title}</ReadField>
            {project.description && <ReadField label="Description">{project.description}</ReadField>}
            <ReadField label="Program Linked">{programTitle}</ReadField>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs font-medium text-muted-foreground mb-1">Status</p><LifecycleStatusPill status={project.status} /></div>
              <ColorReadField label="Project Colour" value={project.color} />
            </div>
          </div>
        )
      ) : editing ? (
        <div className="grid grid-cols-2 gap-3">
          <div><L>Start Date</L><DateField value={draft.start_date} onChange={(v) => upd({ start_date: v })} /><FieldError msg={errors.start_date} /></div>
          <div><L tip={TIPS.project_end_date}>End Date</L><DateField value={draft.end_date} onChange={(v) => upd({ end_date: v })} /><FieldError msg={errors.end_date} /></div>
          <div><L>Project Manager</L><Input value={draft.project_manager} placeholder="e.g., Jane Smith" onChange={(e) => upd({ project_manager: e.target.value })} /><FieldError msg={errors.project_manager} /></div>
          <div><L>Project Officer</L><Input value={draft.project_officer} placeholder="e.g., John Citizen" onChange={(e) => upd({ project_officer: e.target.value })} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <ReadField label="Start Date" icon={Calendar}>{fmtDate(project.start_date)}</ReadField>
          <ReadField label="End Date" icon={Calendar} tip={TIPS.project_end_date}>{fmtDate(project.end_date)}</ReadField>
          <PersonField label="Project Manager" name={project.project_manager} />
          <PersonField label="Project Officer" name={project.project_officer} />
        </div>
      )}
      {editing && <CardEditFooter onCancel={cancel} onSave={save} saving={saving} />}
      <DiscardChangesDialog isOpen={confirmDiscard} subject="project changes" onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); setDraft(null); }} />
    </div>
  );
}