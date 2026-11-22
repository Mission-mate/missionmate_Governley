import React, { useState } from 'react';
import { Calendar, Plus } from 'lucide-react';
import { saveProgram } from '@/lib/programs/programSave';
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
  details: { title: 'Program Details', keys: ['title', 'description', 'status', 'color'] },
  governance: { title: 'Program Governance and Timeline', keys: ['program_lead', 'executive_sponsor', 'start_date', 'end_date'] },
};

const validate = (d, section) => {
  const e = {};
  if (section === 'details') {
    if (!(d.title || '').trim()) e.title = 'Program title is required.';
  } else {
    if (!(d.program_lead || '').trim()) e.program_lead = 'Program manager is required.';
    if (!d.start_date) e.start_date = 'Program start date is required.';
    if (d.start_date && d.end_date && d.end_date < d.start_date) e.end_date = 'End date must be on or after the start date.';
  }
  return e;
};


/** One inline-editable section of a program's overview: 'details' or 'governance'. */
export default function ProgramDetailsCard({ program, onUpdate, section = 'details', locked, onEditingChange }) {
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
  const opts = program.status === 'archived' ? [...STATUS, { value: 'archived', name: 'Archived', color: 'red' }] : STATUS;

  const cancel = () => {
    const dirty = keys.some((k) => (draft[k] || '') !== (program[k] || ''));
    if (dirty) setConfirmDiscard(true); else setDraft(null);
  };

  const save = async () => {
    const e = validate(draft, section);
    setErrors(e);
    if (Object.keys(e).length) return;
    setSaving(true);
    const data = { ...draft };
    if (section === 'details') { data.title = draft.title.trim(); data.color = draft.color || 'blue'; }
    else data.program_lead = draft.program_lead.trim();
    try {
      await saveProgram(program.id, data);
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
        {!editing && <SectionEditButton disabled={locked} onClick={() => { setErrors({}); setShowDesc(!!program.description); setDraft(Object.fromEntries(keys.map((k) => [k, program[k] || '']))); }} />}
      </div>
      {section === 'details' ? (
        editing ? (
          <div className="space-y-3">
            <div><L>Program Title</L><Input value={draft.title} onChange={(e) => upd({ title: e.target.value })} /><FieldError msg={errors.title} /></div>
            {showDesc ? (
              <div><L>Description</L><Textarea rows={3} autoFocus={!program.description} value={draft.description} onChange={(e) => upd({ description: e.target.value })} className="resize-none" /></div>
            ) : (
              <button type="button" onClick={() => setShowDesc(true)} className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"><Plus className="w-3.5 h-3.5" /> Add Description</button>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><L>Status</L><ColoredSelect value={opts.find((o) => o.value === draft.status)?.name || ''} allowClear={false} options={opts} onChange={(n) => upd({ status: opts.find((o) => o.name === n)?.value })} /></div>
              <div><L>Program Colour</L><ColorPicker value={draft.color} onChange={(v) => upd({ color: v })} /></div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <ReadField label="Program Title">{program.title}</ReadField>
            {program.description && <ReadField label="Description">{program.description}</ReadField>}
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs font-medium text-muted-foreground mb-1">Status</p><LifecycleStatusPill status={program.status} /></div>
              <ColorReadField label="Program Colour" value={program.color} />
            </div>
          </div>
        )
      ) : editing ? (
        <div className="grid grid-cols-2 gap-3">
          <div><L>Program Manager</L><Input value={draft.program_lead} onChange={(e) => upd({ program_lead: e.target.value })} /><FieldError msg={errors.program_lead} /></div>
          <div><L tip={TIPS.executive_sponsor}>Executive Sponsor</L><Input value={draft.executive_sponsor} onChange={(e) => upd({ executive_sponsor: e.target.value })} /></div>
          <div><L>Start Date</L><DateField value={draft.start_date} onChange={(v) => upd({ start_date: v })} /><FieldError msg={errors.start_date} /></div>
          <div><L tip={TIPS.end_date}>End Date</L><DateField value={draft.end_date} onChange={(v) => upd({ end_date: v })} /><FieldError msg={errors.end_date} /></div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <PersonField label="Program Manager" name={program.program_lead} />
          <PersonField label="Executive Sponsor" tip={TIPS.executive_sponsor} name={program.executive_sponsor} />
          <ReadField label="Start Date" icon={Calendar}>{fmtDate(program.start_date)}</ReadField>
          <ReadField label="End Date" icon={Calendar} tip={TIPS.end_date}>{fmtDate(program.end_date)}</ReadField>
        </div>
      )}
      {editing && <CardEditFooter onCancel={cancel} onSave={save} saving={saving} />}
      <DiscardChangesDialog isOpen={confirmDiscard} subject="program changes" onClose={() => setConfirmDiscard(false)} onConfirm={() => { setConfirmDiscard(false); setDraft(null); }} />
    </div>
  );
}