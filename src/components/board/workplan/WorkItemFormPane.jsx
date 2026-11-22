import React, { useState, useEffect, useRef } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { Plus } from 'lucide-react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import SectionCard from '@/components/shared/SectionCard';
import ColoredSelect from '@/components/shared/ColoredSelect';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import TaskWorkspaceTab from '@/components/compliance/tasks/TaskWorkspaceTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import AddFromWorkPlanLibraryPanel from '@/components/board/workplan/AddFromWorkPlanLibraryPanel';
import {
  createWorkItem, updateWorkItem,
  resolveFields, nextItemId, formatDate,
} from '@/lib/workPlanApi';
import DateField from '@/components/ui/DateField';
import InfoTooltip from '@/components/risk/InfoTooltip';

const DUE_DATE_TIP = 'The latest date this item should be completed by';
import { base44 } from '@/api/base44Client';
import { OPTION_COLORS } from '@/lib/registerColors';
import { cn } from '@/lib/utils';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

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

function FieldLabel({ children, required, error, tip }) {
  return (
    <Label className={cn('mb-1.5 flex items-center gap-1 text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}{required && <span className="text-destructive"> *</span>}
      {tip && <InfoTooltip text={tip} />}
    </Label>
  );
}

function ViewValue({ value, multiline }) {
  const empty = value === undefined || value === null || String(value).trim() === '';
  if (empty) return <p className="text-sm text-muted-foreground/50">—</p>;
  return <p className={cn('text-sm text-foreground', multiline && 'whitespace-pre-wrap')}>{value}</p>;
}

function ViewFieldValue({ field, value }) {
  if (field.type === 'Date') return <ViewValue value={formatDate(value)} />;
  if (field.type === 'Single Select') {
    const s = getOptionStyle(field.config?.options, value);
    if (value && s) return <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', s.bg, s.text)}>{value}</span>;
  }
  return <ViewValue value={value} />;
}

function FieldInput({ field, value, onChange, invalid, workPlan }) {
  if (field.type === 'Date') {
    const ranged = field.id === 'due_date';
    return (
      <DateField
        value={value || ''}
        onChange={onChange}
        minDate={ranged ? workPlan?.financial_year_start : undefined}
        maxDate={ranged ? workPlan?.financial_year_end : undefined}
        inputClassName={cn('bg-white', invalid && 'border-destructive focus-visible:ring-destructive')}
      />
    );
  }
  if (field.type === 'Single Select') {
    const opts = field.config?.options || [];
    return (
      <ColoredSelect
        value={value || ''}
        onChange={onChange}
        options={opts}
        invalid={invalid}
      />
    );
  }
  return (
    <Input
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.config?.placeholder || (field.id === 'owner' ? 'E.g., Secretary' : `Enter ${field.label.toLowerCase()}...`)}
      className={cn('bg-white', invalid && 'border-destructive focus-visible:ring-destructive')}
    />
  );
}

export default function WorkItemFormPane({ workPlan, item, allItems = [], onClose, onSaved, readOnly = false }) {
  const fields = resolveFields(workPlan?.config);
  const [tab, setTab] = useState('details');
  const counts = useRecordTabCounts('work_plan_item', item?.id, { notes: 'pane', tasks: 'workspace' });
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [showDescription, setShowDescription] = useState(false);
  const [errors, setErrors] = useState({});
  const isEdit = !!item;
  // An existing work item can always return to view-only via Done; a new one stays in edit.
  const viewMode = isEdit && !isEditing;
  // Two-page add flow: "create" (new work item) | "library" (add from library).
  const showAddPages = !isEdit && !readOnly;
  const [addPage, setAddPage] = useState('create');

  const [currentUser, setCurrentUser] = useState(null);
  useEffect(() => { base44.auth.me().then((u) => setCurrentUser(u)).catch(() => {}); }, []);
  const [baseline, setBaseline] = useState({});
  const setInitial = (init) => { setForm(init); setBaseline(init); };

  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const [tasksDirty, setTasksDirty] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, notesDirty, tasksDirty },
    baseline: { form: viewMode ? form : baseline, notesDirty: false, tasksDirty: false },
    onClose, saving, subject: 'work item changes',
  });
  const guardedClose = () => requestClose();
  const dirty = !draftEqual(form, baseline);
  // Cancel restores the saved values and returns to view-only; a new work item's Cancel closes the pane.
  const cancelEdit = () => (isEdit ? (setForm(baseline), setErrors({}), setIsEditing(false)) : requestClose());
  // Done returns to view-only (guarded so unsaved note/checklist edits are never lost).
  const exitEdit = () => requestClose(() => { setForm(baseline); setErrors({}); setIsEditing(false); });

  useEffect(() => {
    if (item) {
      setInitial({
        title: item.title || '',
        description: item.description || '',
        category: item.category || '',
        frequency: item.frequency || '',
        owner: item.owner || '',
        due_date: item.due_date || '',
        priority: item.priority || '',
        status: item.status || 'Not Started',
        ...(item.custom_fields || {}),
      });
    } else {
      setInitial({ status: 'Not Started', title: '', description: '' });
    }
    setErrors({});
    setTab('details');
    setIsEditing(!readOnly);
    setShowDescription(!!item?.description);
    setAddPage('create');
    setNotesDirty(false);
    setTasksDirty(false);
  }, [item?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const REQUIRED = {
    title: 'Work Item Title',
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
    const coreKeys = ['title', 'description', 'category', 'frequency', 'owner', 'due_date', 'priority', 'status'];
    const coreData = {};
    const customData = {};
    for (const [k, v] of Object.entries(form)) {
      if (coreKeys.includes(k)) coreData[k] = v; else customData[k] = v;
    }
    const payload = { ...coreData, custom_fields: customData };
    if (isEdit) {
      await updateWorkItem(item.id, payload);
    } else {
      await createWorkItem(workPlan.id, { ...payload, item_id: nextItemId(allItems), register_status: 'active' });
    }
    setSaving(false);
    onSaved();
    // Saved — an existing work item returns to view-only with the saved values as the new baseline.
    if (isEdit) { setBaseline(form); setIsEditing(false); }
    else onClose();
  });

  // Work item detail fields ordered for the pane
  const DETAIL_ORDER = ['category', 'due_date', 'owner', 'status', 'priority', 'frequency'];
  const detailFields = [...fields].sort((a, b) => {
    const ai = DETAIL_ORDER.indexOf(a.id); const bi = DETAIL_ORDER.indexOf(b.id);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <>
    {dialog}
    <SlidePane isOpen onClose={guardedClose}>
      <div
        className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="relative px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {viewMode ? 'View Work Item' : isEdit ? 'Edit Work Item' : 'Add Work Item'}
              </h2>
              <PaneIconHeaderActions showEdit={viewMode} onEdit={() => setIsEditing(true)} onClose={guardedClose} />
            </div>

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
            {isEdit && <ViewModeHint className="mt-1.5" editing={!viewMode} />}

          {/* Tabs — only for an existing work item; sit above the header divider */}
          {isEdit && (
            <div className="mt-4">
              <CapsuleTabs animated
                value={tab}
                onChange={setTab}
                className="w-fit"
                tabs={[
                  { value: 'details', label: 'Overview' },
                  { value: 'tasks', label: 'Checklist', count: counts.tasks },
                  { value: 'notes', label: 'Notes', count: counts.notes },
                  { value: 'documents', label: 'Documents', count: counts.documents },
                ]}
              />
            </div>
          )}
          
          </div>

          {/* Content */}
          <div className={cn('flex-1 min-h-0', tab === 'notes' || tab === 'tasks' ? 'flex' : 'overflow-y-auto px-5 py-4')}>
            {showAddPages && addPage === 'library' && (
              <AddFromWorkPlanLibraryPanel
                workPlan={workPlan}
                workItems={allItems}
                onApplied={onSaved}
              />
            )}

            {(!showAddPages || addPage === 'create') && tab === 'details' && (
              <div className="space-y-4">
                {/* Core: Title + Description */}
                <SectionCard>
                  <div>
                    <FieldLabel required={!viewMode} error={errors.title}>Work item title</FieldLabel>
                    {viewMode ? (
                      <ViewValue value={form.title} />
                    ) : (
                      <Input
                        value={form.title || ''}
                        onChange={(e) => { set('title', e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: false })); }}
                        placeholder="e.g. Review and approve annual budget"
                        className={cn('bg-white', errors.title && 'border-destructive focus-visible:ring-destructive')}
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
                        placeholder="Describe the work item..."
                        rows={3}
                        className="w-full min-h-[72px] rounded-md border border-input bg-white px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
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

                {/* Work Item Details */}
                {detailFields.length > 0 && (
                  <SectionCard title="Work Item Details">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                      {detailFields.map((field) => {
                        const req = field.id === 'status' || field.id === 'due_date';
                        const isDue = field.id === 'due_date';
                        const isEveryFreq = field.id === 'frequency' && form.frequency === 'Every';
                        return (
                          <React.Fragment key={field.id}>
                            <div>
                              <FieldLabel required={!viewMode && req} error={errors[field.id]} tip={isDue ? DUE_DATE_TIP : undefined}>{isDue && viewMode ? 'Date' : field.label}</FieldLabel>
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
                                  workPlan={workPlan}
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
                                    className="bg-white"
                                  />
                                </div>
                                <div>
                                  <FieldLabel>Unit</FieldLabel>
                                  <Select value={form.frequency_unit || 'Months'} onValueChange={(v) => set('frequency_unit', v)}>
                                    <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
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

            {tab === 'tasks' && item?.id && (
              <TaskWorkspaceTab key={item.id} parentType="work_plan_item" parentId={item.id} readOnly={viewMode} onDirtyChange={setTasksDirty} />
            )}

            {tab === 'notes' && item?.id && (
              <PageNotesTab key={`${item.id}-${viewMode ? 'view' : 'edit'}`} objectType="work_plan_item" objectId={item.id} readOnly={viewMode} flush onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
            )}

            {tab === 'documents' && item?.id && (
              <DocumentsTab objectType="work_plan_item" objectId={item.id} currentUser={currentUser} hideTitle readOnly={viewMode} compact />
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
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {viewMode ? (
                <Button variant="outline" onClick={guardedClose}>Close</Button>
              ) : (
                <EditFooterActions dirty={!isEdit || dirty} onCancel={cancelEdit} onSave={handleSave}
                  saving={saving} saveLabel={isEdit ? undefined : 'Add Work Item'} />
              )}
            </div>
          )}

          {/* Footer — Notes/Docs/Checklist tabs (edit mode only): Cancel returns to view-only.
              On Notes, Save Changes writes the open note and any edited fields.
              Unsaved checklist edits show their own Cancel / Save changes in its place. */}
          {tab !== 'details' && !viewMode && !(tab === 'tasks' && tasksDirty) && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {tab === 'notes'
                ? <EditFooterActions dirty={notesDirty || dirty} onCancel={exitEdit} saving={saving || note.saving}
                    onSave={() => note.saveThen(() => (dirty ? (setTab('details'), handleSave()) : setIsEditing(false)))} />
                : <EditFooterActions dirty={false} onCancel={exitEdit} />}
            </div>
          )}
      </div>
    </SlidePane>
    </>
  );
}