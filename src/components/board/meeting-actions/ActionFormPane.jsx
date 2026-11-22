import React, { useState, useEffect, useRef } from 'react';
import { Plus, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MeetingSearch from '@/components/board/meeting-actions/MeetingSearch';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldLabel, ViewValue } from '@/components/board/registers/paneFields';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import SectionCard from '@/components/shared/SectionCard';
import ColoredSelect from '@/components/shared/ColoredSelect';
import DateField from '@/components/ui/DateField';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import TaskWorkspaceTab from '@/components/compliance/tasks/TaskWorkspaceTab';

// Textarea that grows to fit its content so long descriptions are fully visible
function AutoTextarea({ value, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);
  return <textarea ref={ref} value={value} {...props} />;
}
import {
  createAction, updateAction,
  formatDate, resolveFields, nextActionId, MEETING_FIELD_IDS } from
'@/lib/meetingActionApi';
import { base44 } from '@/api/base44Client';
import { OPTION_COLORS } from '@/lib/registerColors';
import { cn } from '@/lib/utils';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import { toast } from '@/components/ui/use-toast';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

// Example-style placeholders for the built-in text fields. Used as the fallback
// when a register's saved field config carries no placeholder of its own.
const FIELD_PLACEHOLDERS = {
  assigned_to: 'E.g., Finance Director',
  raised_by: 'E.g., Treasurer',
};

// Shown in the form but never stored on the action: Action State is a projection
// of register_status, and the meeting's title, committee and date come from the linked Meeting.
const DERIVED_KEYS = ['action_state', 'meeting_name', 'meeting_committee', 'meeting_date'];

// Open/Closed projection of register_status — the same field the Move To bulk action sets.
const ACTION_STATE_OPTIONS = [{ name: 'Open' }, { name: 'Closed' }];

function getOptionStyle(options, value) {
  if (!value) return null;
  const opt = (options || []).find((o) => o.name === value);
  if (!opt) return null;
  const c = OPTION_COLORS.find((c) => c.id === opt.color);
  return c ? { bg: c.bg, text: c.text } : null;
}

// View-mode renderer that formats dates and multi-select the same way as the table
function ViewFieldValue({ field, value }) {
  if (field.type === 'Date') return <ViewValue value={value ? formatDate(value) : ''} />;
  if (field.type === 'Multi Select') {
    let names = [];
    try {names = value ? JSON.parse(value) : [];} catch {names = value ? [value] : [];}
    if (!names.length) return <ViewValue value="" />;
    return (
      <div className="flex flex-wrap gap-1.5">
        {names.map((n) => {
          const s = getOptionStyle(field.config?.options, n);
          return <span key={n} className={cn('px-2 py-0.5 rounded text-xs font-medium', s ? `${s.bg} ${s.text}` : 'bg-muted text-muted-foreground')}>{n}</span>;
        })}
      </div>);
  }
  if (field.type === 'Single Select') {
    const s = getOptionStyle(field.config?.options, value);
    if (value && s) return <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', s.bg, s.text)}>{value}</span>;
  }
  return <ViewValue value={value} />;
}

// A generic field renderer for the form
function FieldInput({ field, value, onChange, readOnly, invalid, allowClear = true }) {
  if (field.type === 'Single Select') {
    const opts = field.config?.options || [];
    return (
      <ColoredSelect
        value={value || ''}
        onChange={onChange}
        options={opts}
        disabled={readOnly}
        invalid={invalid}
        allowClear={allowClear}
      />);

  }
  if (field.type === 'Date') {
    return (
      <div className={cn(invalid && 'rounded-md ring-1 ring-destructive')}>
        <DateField value={value || ''} onChange={onChange} disabled={readOnly} inputClassName="bg-white" />
      </div>);
  }
  if (field.type === 'Multi Select') {
    const opts = field.config?.options || [];
    let selected = [];
    try {selected = value ? JSON.parse(value) : [];} catch {selected = value ? [value] : [];}
    const toggle = (name) => {
      if (readOnly) return;
      const next = selected.includes(name) ? selected.filter((s) => s !== name) : [...selected, name];
      onChange(JSON.stringify(next));
    };
    return (
      <div className="flex flex-wrap gap-1.5">
        {opts.map((o) => {
          const isSelected = selected.includes(o.name);
          const s = getOptionStyle(opts, o.name);
          return (
            <button
              key={o.name}
              type="button"
              disabled={readOnly}
              onClick={() => toggle(o.name)}
              className={cn(
                'px-2.5 py-1 rounded text-xs font-medium border transition-all disabled:cursor-not-allowed',
                isSelected && s ? `${s.bg} ${s.text} border-transparent` : 'bg-muted text-muted-foreground border-border'
              )}>
              
              {o.name}
            </button>);

        })}
      </div>);

  }
  // Text/Number, People, Notes, Progress, Checkbox, default
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={FIELD_PLACEHOLDERS[field.id] || field.config?.placeholder || `Enter ${field.label.toLowerCase()}...`}
      disabled={readOnly}
      className={cn('bg-white', invalid && 'border-destructive focus-visible:ring-destructive')} />);



}

export default function ActionFormPane({ register, action, allActions = [], onClose, onSaved, readOnly = false }) {
  const fields = resolveFields(register?.config);
  const navigate = useNavigate();
  const [tab, setTab] = useState('details');
  const counts = useRecordTabCounts('meeting_action', action?.id, { notes: 'pane', tasks: 'workspace' });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  // View panes open read-only; a pencil switches them into edit mode.
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [errors, setErrors] = useState({});
  const [showDescription, setShowDescription] = useState(false);
  const isEdit = !!action;
  // An existing action can always return to view-only via Done; a new one stays in edit.
  const viewMode = isEdit && !isEditing;

  const [currentUser, setCurrentUser] = useState(null);
  const [baseline, setBaseline] = useState({});
  const setInitial = (init) => { setForm(init); setBaseline(init); };

  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const [tasksDirty, setTasksDirty] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, notesDirty, tasksDirty }, baseline: { form: baseline, notesDirty: false, tasksDirty: false },
    onClose, saving, enabled: !viewMode, subject: 'action changes',
  });
  const dirty = !draftEqual(form, baseline);
  // Cancel restores the saved values and returns to view-only; a new action's Cancel closes the pane.
  const cancelEdit = () => (isEdit ? (setForm(baseline), setErrors({}), setIdError(''), setIsEditing(false)) : requestClose());
  // Done returns to view-only (guarded so unsaved note/checklist edits are never lost).
  const exitEdit = () => requestClose(() => { setForm(baseline); setErrors({}); setIsEditing(false); });

  useEffect(() => {
    base44.auth.me().then((u) => setCurrentUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    if (action) {
      setInitial({
        action_id: action.action_id || '',
        title: action.title || '',
        description: action.description || '',
        meeting_id: action.meeting_id || '',
        meeting_name: action.meeting_name || '',
        meeting_committee: action.meeting_committee || '',
        meeting_date: action.meeting_date || '',
        minute_ref: action.minute_ref || '',
        priority: action.priority || '',
        raised_by: action.raised_by || '',
        assigned_to: action.assigned_to || '',
        due_date: action.due_date || '',
        status: action.status || 'Not Started',
        action_state: action.register_status === 'completed' ? 'Closed' : 'Open',
        ...(action.custom_fields || {})
      });
    } else {
      setInitial({ action_id: nextActionId(allActions), status: 'Not Started', action_state: 'Open', title: '', description: '' });
    }
    setShowDescription(false);
    setIdError('');
    setErrors({});
    setTab('details');
    setIsEditing(!readOnly);
  }, [action?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  // Linking a meeting fills its committee and date; removing it clears them.
  const setMeeting = (m) => setForm((f) => ({
    ...f,
    meeting_id: m?.id || '',
    meeting_name: m?.title || '',
    meeting_committee: m?.committee_name || '',
    meeting_date: m?.meeting_date || ''
  }));

  // Live duplicate-ID check — shown as the user types, before any save attempt.
  const trimmedId = (form.action_id || '').trim();
  const isDuplicateId = !!trimmedId
    && allActions.some((a) => a.action_id === trimmedId && a.id !== action?.id);
  const shownIdError = idError || (isDuplicateId ? `ID "${trimmedId}" already exists in this register.` : '');

  // Mandatory fields. Meeting details are optional.
  const REQUIRED = ['action_id', 'title', 'status', 'priority'];

  const handleSave = async () => {
    const nextErrors = {};
    for (const key of REQUIRED) {
      if (!String(form[key] ?? '').trim()) nextErrors[key] = true;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    if (isDuplicateId) {
      setIdError(`ID "${trimmedId}" already exists in this register.`);
      return;
    }
    setSaving(true);
    // Separate core fields from custom
    const coreKeys = ['action_id', 'title', 'description', 'meeting_id', 'minute_ref', 'priority', 'raised_by', 'assigned_to', 'due_date', 'status'];
    const coreData = {};
    const customData = {};
    for (const [k, v] of Object.entries(form)) {
      if (DERIVED_KEYS.includes(k)) continue;
      if (coreKeys.includes(k)) coreData[k] = v;else
      customData[k] = v;
    }
    // Action State (Open/Closed) maps onto register_status — the same field Move To uses.
    const register_status = form.action_state === 'Closed' ? 'completed' : 'active';
    const payload = { ...coreData, register_status, custom_fields: customData };
    // A failed save must never leave the button stuck on "Saving..." — reset the
    // flag in finally and keep the pane open so the user's edits are retained.
    try {
      if (isEdit) {
        await updateAction(action.id, payload);
      } else {
        await createAction(register.id, payload);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: isEdit ? 'Could not save action' : 'Could not add action',
        description: err?.message || 'Something went wrong. Please try again.'
      });
      return;
    } finally {
      setSaving(false);
    }
    onSaved();
    // Saved — an existing action returns to view-only with the saved values as the new baseline.
    if (isEdit) { setBaseline(form); setIsEditing(false); }
    else onClose();
  };

  // Meeting fields have their own section; everything else sits under Action Details.
  const actionFields = fields.filter((f) => !MEETING_FIELD_IDS.includes(f.id));

  return (
    <>
    {dialog}
    <SlidePane isOpen onClose={requestClose}>
      <div
        className="h-full bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {viewMode ? 'View Action' : isEdit ? 'Edit Action' : 'Add Meeting Action'}
              </h2>
              <PaneIconHeaderActions showEdit={viewMode} onEdit={() => setIsEditing(true)} onClose={() => requestClose()} />
            </div>
            {isEdit && <ViewModeHint className="mt-1.5" editing={!viewMode} />}

          {/* Tabs — existing action only; sit above the header divider */}
          {isEdit &&
          <div className="mt-4">
            <CapsuleTabs animated
              value={tab}
              onChange={setTab}
              className="w-fit"
              tabs={[
              { value: 'details', label: 'Overview' },
              { value: 'tasks', label: 'Checklist', count: counts.tasks },
              { value: 'notes', label: 'Notes', count: counts.notes },
              { value: 'documents', label: 'Documents', count: counts.documents }]
              } />
          </div>
          }
          
          </div>

          {/* Content */}
          <div className={cn('flex-1 min-h-0', tab === 'notes' || tab === 'tasks' ? 'flex' : 'overflow-y-auto px-5 py-4')}>

            {tab === 'details' &&
            <div className="space-y-4">
                {/* Section 1 — Core: Action ID, Title + optional Description */}
                <SectionCard>
                  <div>
                    <FieldLabel required={!viewMode} error={errors.action_id}>Action ID</FieldLabel>
                    {viewMode ?
                  <ViewValue value={form.action_id} /> :
                  <>
                        <Input
                      value={form.action_id || ''}
                      onChange={(e) => {set('action_id', e.target.value);if (idError) setIdError('');if (errors.action_id) setErrors((p) => ({ ...p, action_id: false }));}}
                      placeholder="e.g. ACT-001 or BOARD-01"
                      className={cn('bg-white', (shownIdError || errors.action_id) && 'border-destructive focus-visible:ring-destructive')} />
                        {shownIdError && <p className="mt-1 text-xs text-destructive">{shownIdError}</p>}
                        {errors.action_id && !shownIdError && <p className="mt-1 text-xs text-destructive">Action ID is required.</p>}
                      </>
                  }
                  </div>
                  <div className="mt-4">
                    <FieldLabel required={!viewMode} error={errors.title}>Action Title</FieldLabel>
                    {viewMode ?
                  <ViewValue value={form.title} /> :
                  <>
                        <Input
                      value={form.title || ''}
                      onChange={(e) => {set('title', e.target.value);if (errors.title) setErrors((p) => ({ ...p, title: false }));}}
                      placeholder="e.g. Prepare a 12-month cashflow forecast for board review"
                      className={cn('bg-white', errors.title && 'border-destructive focus-visible:ring-destructive')} />
                        {errors.title && <p className="mt-1 text-xs text-destructive">Action Title is required.</p>}
                      </>
                  }
                  </div>
                  {viewMode ?
                form.description ?
                <div className="mt-4">
                        <FieldLabel>Description</FieldLabel>
                        <ViewValue value={form.description} multiline />
                      </div> :
                null :
                showDescription || form.description ?
                <div className="mt-4">
                      <FieldLabel>Description</FieldLabel>
                      <AutoTextarea
                    value={form.description || ''}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Describe the action required..."
                    rows={3}
                    autoFocus={!form.description}
                    className="w-full min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50" />
                    </div> :
                <button
                  type="button"
                  onClick={() => setShowDescription(true)}
                  className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80">
                      <Plus className="w-3.5 h-3.5" /> Add Description
                    </button>
                }
                </SectionCard>

                {/* Section 2 — Action Details */}
                {actionFields.length > 0 &&
              <SectionCard title="Action Details">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                      <div>
                        <FieldLabel required={!viewMode}>Action State</FieldLabel>
                        {viewMode ?
                        <ViewValue value={form.action_state} /> :
                        <ColoredSelect
                          value={form.action_state || 'Open'}
                          onChange={(v) => set('action_state', v || 'Open')}
                          options={ACTION_STATE_OPTIONS}
                          allowClear={false} />
                        }
                      </div>
                      {actionFields.map((field) => {
                    const req = ['status', 'priority'].includes(field.id);
                    return (
                      <div key={field.id} className={field.id === 'description' ? 'col-span-2' : ''}>
                            <FieldLabel required={!viewMode && req} error={errors[field.id]}>{field.label}</FieldLabel>
                            {viewMode ?
                        <ViewFieldValue field={field} value={form[field.id]} /> :
                        <FieldInput
                          field={field}
                          value={form[field.id]}
                          onChange={(v) => {set(field.id, v);if (errors[field.id]) setErrors((p) => ({ ...p, [field.id]: false }));}}
                          readOnly={false}
                          invalid={errors[field.id]}
                          allowClear={field.id !== 'status'} />
                        }
                          </div>);
                  })}
                    </div>
                  </SectionCard>
              }

                {/* Section 3 — Meeting Details */}
                <SectionCard title="Meeting Details">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div className="min-w-0">
                      <FieldLabel>Meeting Title</FieldLabel>
                      {viewMode ?
                      <div className="flex items-start justify-between gap-2">
                          <ViewValue value={form.meeting_name} />
                          {form.meeting_id && form.meeting_name &&
                        <button
                          type="button"
                          onClick={() => navigate(`/board/meetings/${form.meeting_id}`)}
                          title="Open meeting"
                          className="-mt-1 w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-[background-color,color] duration-[120ms]">
                              <ExternalLink className="w-4 h-4" strokeWidth={1.8} />
                            </button>
                        }
                        </div> :
                      <MeetingSearch value={{ id: form.meeting_id, title: form.meeting_name }} onChange={setMeeting} />
                      }
                    </div>
                    <div>
                      <FieldLabel>Meeting Date</FieldLabel>
                      {viewMode ?
                      <ViewValue value={form.meeting_date ? formatDate(form.meeting_date) : ''} /> :
                      <Input value={form.meeting_date ? formatDate(form.meeting_date) : ''} disabled readOnly placeholder="Filled from the meeting" className="bg-white" />
                      }
                    </div>
                    <div>
                      <FieldLabel>Meeting Committee</FieldLabel>
                      {viewMode ?
                      <ViewValue value={form.meeting_committee} /> :
                      <Input value={form.meeting_committee || ''} disabled readOnly placeholder="Filled from the meeting" className="bg-white" />
                      }
                    </div>
                    <div>
                      <FieldLabel>Minute/Agenda Reference</FieldLabel>
                      {viewMode ?
                      <ViewValue value={form.minute_ref} /> :
                      <Input value={form.minute_ref || ''} onChange={(e) => set('minute_ref', e.target.value)} placeholder="E.g., Item 1.1" className="bg-white" />
                      }
                    </div>
                  </div>
                </SectionCard>
              </div>
            }

            {tab === 'tasks' && action?.id &&
            <TaskWorkspaceTab key={action.id} parentType="meeting_action" parentId={action.id} readOnly={viewMode} onDirtyChange={setTasksDirty} />
            }

            {tab === 'notes' && action?.id &&
            <PageNotesTab key={`${action.id}-${viewMode ? 'view' : 'edit'}`} objectType="meeting_action" objectId={action.id} readOnly={viewMode} flush onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
            }

            {tab === 'documents' && action?.id &&
            <DocumentsTab objectType="meeting_action" objectId={action.id} currentUser={currentUser} hideTitle readOnly={viewMode} compact />
            }
          </div>

          {/* Footer */}
          {tab === 'details' &&
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {viewMode ?
            <Button variant="outline" onClick={onClose} className="ml-auto">Close</Button> :
            <EditFooterActions dirty={!isEdit || dirty} onCancel={cancelEdit} onSave={handleSave}
              saving={saving} saveDisabled={isDuplicateId} saveLabel={isEdit ? undefined : 'Add Action'} />
            }
            </div>
          }

          {/* Footer — Notes/Checklist/Documents tabs (edit mode only): Cancel returns to view-only.
              On Notes, Save Changes writes the open note and any edited fields.
              Unsaved checklist edits show their own Cancel / Save changes in its place. */}
          {tab !== 'details' && !viewMode && !(tab === 'tasks' && tasksDirty) &&
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {tab === 'notes'
                ? <EditFooterActions dirty={notesDirty || dirty} onCancel={exitEdit} saving={saving || note.saving}
                    onSave={() => note.saveThen(() => (dirty ? (setTab('details'), handleSave()) : setIsEditing(false)))} />
                : <EditFooterActions dirty={false} onCancel={exitEdit} />}
            </div>
          }
      </div>
    </SlidePane>
    </>);

}