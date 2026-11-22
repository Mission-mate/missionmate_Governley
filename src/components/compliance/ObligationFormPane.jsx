import React, { useState, useEffect, useRef } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Plus } from 'lucide-react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import SectionCard from '@/components/shared/SectionCard';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DateField from '@/components/ui/DateField';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import ViewModeHint from '@/components/shared/ViewModeHint';
import TaskWorkspaceTab from '@/components/compliance/tasks/TaskWorkspaceTab';
import AddFromLibraryPanel from '@/components/compliance/templates/AddFromLibraryPanel';
import {
  createObligation, updateObligation,
  formatDate, resolveFields,
} from '@/lib/complianceApi';
import { base44 } from '@/api/base44Client';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import { OPTION_COLORS } from '@/lib/registerColors';
import { cn } from '@/lib/utils';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';

// Textarea that grows to fit its content
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

function getOptionStyle(options, value) {
  if (!value) return null;
  const opt = (options || []).find((o) => o.name === value);
  if (!opt) return null;
  const c = OPTION_COLORS.find((c) => c.id === opt.color);
  return c ? { bg: c.bg, text: c.text } : null;
}

function FieldLabel({ children, required, error }) {
  return (
    <Label className={cn('mb-1.5 block text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}{required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

function ViewValue({ value, multiline }) {
  const empty = value === undefined || value === null || String(value).trim() === '';
  if (empty) return <p className="text-sm text-muted-foreground/50">—</p>;
  return <p className={cn('text-sm text-foreground', multiline && 'whitespace-pre-wrap')}>{value}</p>;
}

function ViewFieldValue({ field, value }) {
  if (field.type === 'Date') return <ViewValue value={value ? formatDate(value) : ''} />;
  if (field.type === 'Single Select') {
    const s = getOptionStyle(field.config?.options, value);
    if (value && s) return <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', s.bg, s.text)}>{value}</span>;
  }
  return <ViewValue value={value} />;
}

function FieldInput({ field, value, onChange, invalid, register }) {
  if (field.type === 'Single Select') {
    const opts = field.config?.options || [];
    return (
      <ColoredSelect
        value={value || ''}
        onChange={onChange}
        options={opts}
        invalid={invalid}
        className="bg-background"
      />
    );
  }
  if (field.type === 'Date') {
    // Due Date is limited to the calendar's compliance period (inclusive).
    const ranged = field.id === 'due_date';
    return (
      <div className={cn(invalid && 'rounded-md ring-1 ring-destructive')}>
        <DateField
          value={value || ''}
          onChange={onChange}
          inputClassName="bg-background"
          minDate={ranged ? register?.financial_year_start : undefined}
          maxDate={ranged ? register?.financial_year_end : undefined}
        />
      </div>
    );
  }
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.config?.placeholder || `Enter ${field.label.toLowerCase()}...`}
      className={cn('bg-background', invalid && 'border-destructive focus-visible:ring-destructive')}
    />
  );
}

export default function ObligationFormPane({ register, obligation, allObligations = [], onClose, onSaved, readOnly = false }) {
  const fields = resolveFields(register?.config);
  const [tab, setTab] = useState('details');
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [showDescription, setShowDescription] = useState(false);
  const [errors, setErrors] = useState({});
  const viewMode = readOnly && !isEditing;
  const isEdit = !!obligation;
  // Two-page add flow: "create" (new obligation form) | "library" (add from library).
  // Only available when adding a brand-new obligation — never in edit/view.
  const showAddPages = !isEdit && !readOnly;
  const [addPage, setAddPage] = useState('create');
  // Notes/Tasks tabs report unsaved edits — folded into the shared guard below.
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const [tasksDirty, setTasksDirty] = useState(false);
  const [baseline, setBaseline] = useState({});
  const setInitial = (init) => { setForm(init); setBaseline(init); };
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, notesDirty, tasksDirty },
    baseline: { form: viewMode ? form : baseline, notesDirty: false, tasksDirty: false },
    onClose, saving, subject: 'obligation changes',
  });
  const guardedClose = () => requestClose();
  // Cancel / Save Changes only appear once a field differs from the saved obligation.
  const formDirty = !draftEqual(form, baseline);
  const discard = () => { setForm(baseline); setErrors({}); setShowDescription(!!baseline.description); };
  // Cancel restores the saved values and returns to view-only; a pane opened straight into edit closes (guarded).
  const cancelEdit = () => (readOnly ? (discard(), setIsEditing(false)) : requestClose());
  // Cancel on the Notes/Docs/Tasks tabs leaves edit mode (guarded): back to view-only, or closes a pane that was opened straight into edit.
  const exitEdit = () => (readOnly
    ? requestClose(() => { discard(); setIsEditing(false); })
    : requestClose());

  const tabCounts = useRecordTabCounts('compliance_obligation', obligation?.id, { notes: 'pane', tasks: 'workspace' });

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then((u) => setCurrentUser(u)).catch(() => {}); }, []);

  useEffect(() => {
    if (obligation) {
      setInitial({
        title: obligation.title || '',
        description: obligation.description || '',
        category: obligation.category || '',
        regulator: obligation.regulator || '',
        frequency: obligation.frequency || '',
        owner: obligation.owner || '',
        due_date: obligation.due_date || '',
        priority: obligation.priority || '',
        status: obligation.status || 'Not Started',
        ...(obligation.custom_fields || {}),
      });
    } else {
      setInitial({ status: 'Not Started', title: '', description: '' });
    }
    setIdError('');
    setErrors({});
    setTab('details');
    setIsEditing(!readOnly);
    setShowDescription(!!obligation?.description);
    setAddPage('create');
    setNotesDirty(false);
    setTasksDirty(false);
  }, [obligation?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const REQUIRED = {
    title: 'Obligation Title',
    due_date: 'Due Date',
    status: 'Status',
  };

  const handleSave = guardSave(setSaving, async () => {
    const nextErrors = {};
    for (const key of Object.keys(REQUIRED)) {
      if (!String(form[key] ?? '').trim()) nextErrors[key] = true;
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSaving(true);
    const coreKeys = ['title', 'description', 'category', 'regulator', 'frequency', 'owner', 'due_date', 'priority', 'status'];
    const coreData = {};
    const customData = {};
    for (const [k, v] of Object.entries(form)) {
      if (coreKeys.includes(k)) coreData[k] = v; else customData[k] = v;
    }
    const payload = { ...coreData, custom_fields: customData };
    if (isEdit) {
      // Saved — back to view-only; a pane opened straight into edit closes.
      await updateObligation(obligation.id, payload);
      setBaseline(form);
      setSaving(false);
      onSaved();
      if (readOnly) setIsEditing(false); else onClose();
      return;
    }
    await createObligation(register.id, { ...payload, register_status: 'active' });
    setSaving(false);
    onSaved();
    onClose();
  });

  // Obligation detail fields ordered for the pane
  const DETAIL_ORDER = ['category', 'regulator', 'due_date', 'owner', 'status', 'priority', 'frequency'];
  const detailFields = [...fields].sort((a, b) => {
    const ai = DETAIL_ORDER.indexOf(a.id); const bi = DETAIL_ORDER.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <>
    {dialog}
    <SlidePane
      isOpen
      onClose={guardedClose}
    >
      <div
        className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {viewMode ? 'View Obligation' : isEdit ? 'Edit Obligation' : 'Add Compliance Obligation'}
              </h2>
              <PaneIconHeaderActions showEdit={viewMode} onEdit={() => setIsEditing(true)} onClose={guardedClose} />
            </div>
            {isEdit && <ViewModeHint className="mt-1.5" editing={!viewMode} />}

            {/* Circle navigation between Create New and Add from Library (add flow only) */}
            {showAddPages && (
              <div className="mt-4 flex justify-start">
                <CapsuleTabs animated
                  value={addPage}
                  onChange={setAddPage}
                  size="sm"
                  className="w-fit"
                  tabs={[
                    { value: 'create', label: 'Create New' },
                    { value: 'library', label: 'Add from Library' },
                  ]}
                />
              </div>
            )}
          {/* Tabs — only shown for an existing obligation; sit above the header divider */}
          {isEdit && (
            <div className="mt-4">
              <CapsuleTabs animated
                value={tab}
                onChange={setTab}
                className="w-fit"
                tabs={[
                  { value: 'details', label: 'Overview' },
                  { value: 'notes', label: 'Notes', count: tabCounts.notes },
                  { value: 'tasks', label: 'Checklist', count: tabCounts.tasks },
                  { value: 'documents', label: 'Documents', count: tabCounts.documents },
                ]}
              />
            </div>
          )}
          {/* Documents tab actions (New Folder / Upload) render here, above the divider */}
          
          </div>

          {/* Content */}
          <div className={cn('flex-1 min-h-0', tab === 'notes' || tab === 'tasks' ? 'flex' : 'overflow-y-auto px-5 py-4')}>
            {showAddPages && addPage === 'library' && (
              <AddFromLibraryPanel
                register={register}
                registerObligations={allObligations}
                onApplied={onSaved}
              />
            )}

            {(!showAddPages || addPage === 'create') && tab === 'details' && (
              <div className="space-y-4">
                {/* Core: ID + Title + Description */}
                <SectionCard>
                  <div>
                    <FieldLabel required={!viewMode} error={errors.title}>Obligation Title</FieldLabel>
                    {viewMode ? (
                      <ViewValue value={form.title} />
                    ) : (
                      <Input
                        value={form.title || ''}
                        onChange={(e) => { set('title', e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: false })); }}
                        placeholder="e.g. Lodge annual financial statements"
                        className={cn('bg-background', errors.title && 'border-destructive focus-visible:ring-destructive')}
                      />
                    )}
                  </div>
                  {viewMode ? (
                    form.description ? (
                      <div className="mt-4">
                        <FieldLabel>Description</FieldLabel>
                        <ViewValue value={form.description} multiline />
                      </div>
                    ) : null
                  ) : showDescription ? (
                    <div className="mt-4">
                      <FieldLabel>Description</FieldLabel>
                      <AutoTextarea
                        value={form.description || ''}
                        onChange={(e) => set('description', e.target.value)}
                        placeholder="Describe the compliance obligation..."
                        rows={3}
                        className="w-full min-h-[72px] rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                        autoFocus
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDescription(true)}
                      className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Description
                    </button>
                  )}
                </SectionCard>

                {/* Obligation Details */}
                {detailFields.length > 0 && (
                  <SectionCard title="Obligation Details">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                      {detailFields.map((field) => {
                        const req = field.id === 'status' || field.id === 'due_date';
                        const isEveryFreq = field.id === 'frequency' && form.frequency === 'Every';
                        return (
                          <React.Fragment key={field.id}>
                            <div>
                              <FieldLabel required={!viewMode && req} error={errors[field.id]}>{field.label}</FieldLabel>
                              {viewMode ? (
                                field.id === 'frequency' && form.frequency === 'Every' ? (
                                  <ViewValue value={`Every ${form.frequency_interval || ''} ${form.frequency_unit || ''}`.trim()} />
                                ) : (
                                  <ViewFieldValue field={field} value={form[field.id]} />
                                )
                              ) : (
                                <FieldInput
                                  field={field}
                                  value={form[field.id]}
                                  onChange={(v) => { set(field.id, v); if (errors[field.id]) setErrors((p) => ({ ...p, [field.id]: false })); }}
                                  invalid={errors[field.id]}
                                  register={register}
                                />
                              )}
                            </div>
                            {/* Interval + Unit shown when Frequency is 'Every' (edit mode) */}
                            {!viewMode && isEveryFreq && (
                              <>
                                <div>
                                  <FieldLabel>Interval</FieldLabel>
                                  <Input
                                    type="number"
                                    min="1"
                                    value={form.frequency_interval || ''}
                                    onChange={(e) => set('frequency_interval', e.target.value)}
                                    placeholder="e.g. 4"
                                    className="bg-background"
                                  />
                                </div>
                                <div>
                                  <FieldLabel>Unit</FieldLabel>
                                  <Select value={form.frequency_unit || 'Months'} onValueChange={(v) => set('frequency_unit', v)}>
                                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="Months">Months</SelectItem>
                                      <SelectItem value="Years">Years</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {tab === 'notes' && obligation?.id && (
              <PageNotesTab
                key={`${obligation.id}-${viewMode ? 'view' : 'edit'}`}
                objectType="compliance_obligation"
                objectId={obligation.id}
                readOnly={viewMode}
                flush
                onDirtyChange={setNotesDirty}
                actionsRef={note.actionsRef}
              />
            )}

            {tab === 'tasks' && obligation?.id && (
              <TaskWorkspaceTab key={obligation.id} parentType="compliance_obligation" parentId={obligation.id} readOnly={viewMode} onDirtyChange={setTasksDirty} />
            )}

            {tab === 'documents' && obligation?.id && (
              <DocumentsTab objectType="compliance_obligation" objectId={obligation.id} currentUser={currentUser} hideTitle readOnly={viewMode} compact />
            )}

          </div>

          {/* Footer — Add from Library page: Close only */}
          {showAddPages && addPage === 'library' && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end shrink-0">
              <Button variant="outline" onClick={guardedClose}>Close</Button>
            </div>
          )}

          {/* Footer — Create New / Overview tab */}
          {(!showAddPages || addPage === 'create') && tab === 'details' && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-between shrink-0">
              {viewMode ? (
                <Button variant="outline" onClick={guardedClose} className="ml-auto">Close</Button>
              ) : isEdit ? (
                <div className="ml-auto flex items-center gap-3">
                  <EditFooterActions dirty={formDirty} onCancel={cancelEdit} onSave={handleSave} saving={saving} />
                </div>
              ) : (
                <>
                  <Button variant="outline" onClick={() => requestClose()}>Cancel</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? 'Saving...' : 'Add Obligation'}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Footer — Notes/Docs/Tasks tabs (edit mode only): Cancel returns to view-only.
              On Notes, Save Changes writes the open note and any edited fields.
              Unsaved checklist edits show their own Cancel / Save changes in its place. */}
          {tab !== 'details' && !viewMode && !(tab === 'tasks' && tasksDirty) && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {tab === 'notes'
                ? <EditFooterActions dirty={notesDirty || formDirty} onCancel={exitEdit} saving={saving || note.saving}
                    onSave={() => note.saveThen(() => (formDirty ? (setTab('details'), handleSave()) : readOnly && setIsEditing(false)))} />
                : <EditFooterActions dirty={false} onCancel={exitEdit} />}
            </div>
          )}
      </div>
    </SlidePane>
    </>
  );
}