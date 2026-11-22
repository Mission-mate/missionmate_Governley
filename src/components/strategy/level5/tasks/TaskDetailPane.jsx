import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import SlidePane from '@/components/ui/SlidePane';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import { cn } from '@/lib/utils';
import OverviewTab from './detail/OverviewTab';
import { AddTaskIcon, AddMilestoneIcon, AddSectionIcon } from './AddItemIcons';
import useTaskPaneCounts from './useTaskPaneCounts';
import { useTaskStore } from '@/lib/tasks/taskStore';
import TaskWorkspaceTab from '@/components/compliance/tasks/TaskWorkspaceTab';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
const TABS = ['Overview', 'Checklist', 'Notes'];

/** Task / milestone / section detail pane with capsule tabs. */
export default function TaskDetailPane({
  task, columns, existingIds = [],
  onClose: closeNow, onSave, onCreate, onDelete, onSubtasksAllComplete
}) {
  const [tab, setTab] = useState('Overview');
  const hasTabs = !!task?.id && task.type !== 'section';
  const store = useTaskStore();
  const counts = useTaskPaneCounts(task?.id, { enabled: hasTabs });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [idError, setIdError] = useState('');
  const [dateErrors, setDateErrors] = useState({});
  const [baseline, setBaseline] = useState(null);
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const [subtasksDirty, setSubtasksDirty] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const editing = isEditing || (!!task && !task.id);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, notesDirty, subtasksDirty }, baseline: { form: baseline, notesDirty: false, subtasksDirty: false }, onClose: closeNow, saving, enabled: !!task && !!form && editing, subject: 'task changes',
  });
  const onClose = () => requestClose();
  // Cancel on an existing record restores the saved values and returns to view-only.
  const cancelEdit = () => (task?.id
    ? (setForm(baseline), setIdError(''), setDateErrors({}), setIsEditing(false))
    : requestClose());

  useEffect(() => { setIsEditing(false); }, [task?.id]);

  // Subtask roll-ups change the task's completion while the pane is open — mirror it without resetting the pane.
  useEffect(() => {
    if (!task?.id) return;
    const sync = (f) => (f ? { ...f, completed: !!task.completed, status: task.status || '', progress: Number(task.progress) || 0 } : f);
    setForm(sync);
    setBaseline(sync);
  }, [task?.completed, task?.status, task?.progress]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setTab('Overview');
    setIdError('');
    setDateErrors({});
    const init = task ? {
      custom_id: task.custom_id || '',
      title: task.title || '',
      description: task.description || '',
      start_date: task.start_date || '',
      due_date: task.due_date || '',
      owner: task.owner || '',
      health: task.health || '',
      status: task.status || '',
      priority: task.priority || '',
      effectiveness: task.effectiveness || '',
      progress: Number(task.progress) || 0,
      completed: !!task.completed,
      custom_values: { ...(task.custom_values || {}) }
    } : null;
    setForm(init);
    setBaseline(init);
  }, [task?.id, !!task]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!task || !form) return null;

  const isNew = !task.id;
  const isMilestone = task.type === 'milestone';
  const isSection = task.type === 'section';
  const kindLabel = isSection ? 'Section' : isMilestone ? 'Milestone' : 'Task';
  // Cancel / Save Changes only appear once a field differs from the saved record.
  const formDirty = JSON.stringify(form) !== JSON.stringify(baseline);
  const flush = tab === 'Notes' || tab === 'Checklist';
  // Marking the status Completed auto-fills completion + 100% progress (still manually overridable).
  const set = (k) => (v) =>
    setForm((f) => ({
      ...f,
      [k]: v,
      ...(k === 'status' ? { completed: v === 'Completed', ...(v === 'Completed' ? { progress: 100 } : {}) } : {}),
      ...(k === 'progress' && Number(v) === 100 ? { status: 'Completed', completed: true } : {}),
    }));
  const setCustom = (id) => (v) => setForm((f) => ({ ...f, custom_values: { ...f.custom_values, [id]: v } }));

  // An unsaved new task only has Overview (checklist/notes need a saved record).
  const tabs = isNew || isSection ? ['Overview'] : TABS;

  const save = async () => {
    if (!form.title.trim()) return;
    const id = (form.custom_id || '').trim();
    if (id && existingIds.some((x) => x.toLowerCase() === id.toLowerCase())) {
      setIdError('This ID is already used by another record.');
      return;
    }
    setIdError('');
    // Start and due dates are mandatory for tasks, milestones and subtasks (not sections).
    if (!isSection) {
      const errs = {};
      if (!form.start_date) errs.start_date = 'Start date is required.';
      if (!form.due_date) errs.due_date = 'Due date is required.';
      setDateErrors(errs);
      if (Object.keys(errs).length) return;
    }
    setSaving(true);
    try {
      const payload = { ...form, title: form.title.trim(), custom_id: (form.custom_id || '').trim() };
      if (isNew) { await onCreate(payload); closeNow(); return; }
      await onSave(task.id, payload);
      // Saved — stay in edit mode with the saved values as the new baseline.
      setForm(payload);
      setBaseline(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePane isOpen={!!task} onClose={onClose} className="bg-card shadow-2xl flex flex-col font-body">
      {dialog}
      {/* Header */}
      <div className="flex items-start justify-between gap-2 px-5 pt-4 pb-3">
        <div className="min-w-0 flex-1">
          <p className={cn('flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide', isMilestone ? 'text-[#16A34A] dark:text-green-400' : isSection ? 'text-amber-600 dark:text-amber-400' : 'text-[hsl(var(--primary))]')}>
            {kindLabel === 'Task' && <AddTaskIcon className="w-[15px] h-[15px]" />}
            {isMilestone && <AddMilestoneIcon className="w-[15px] h-[15px]" />}
            {isSection && <AddSectionIcon className="w-[15px] h-[15px]" />}
            {kindLabel}
          </p>
          {/* Read-only banner title — edited via the Title field on the Details tab. Clamped to 2 lines. */}
          <h2 className="text-foreground break-words mt-0.5 text-base [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-bold line-clamp-2">
            {form.title || (isNew ? `New ${kindLabel.toLowerCase()}` : 'Untitled')}
          </h2>
          {!isNew && <ViewModeHint className="mt-1.5" editing={editing} />}
        </div>
        <div className="flex items-center gap-1 shrink-0 pt-1">
          {!isNew && editing && (
            <button onClick={() => onDelete(task)} className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted"><Trash2 className="w-4 h-4" /></button>
          )}
          <PaneIconHeaderActions showEdit={!editing} onEdit={() => setIsEditing(true)} onClose={onClose} />
        </div>
      </div>

      {/* Capsule tabs — hidden for a new task / section (Overview is the only tab) */}
      <div className={cn('px-5 pb-4', !hasTabs && 'hidden')}>
        <CapsuleTabs animated className="w-fit" value={tab} onChange={setTab}
          tabs={tabs.map((t) => ({ value: t, label: t, count: counts[t] }))} />
      </div>

      {/* Body */}
      <div className={cn('flex-1 min-h-0', flush ? 'flex border-t border-border' : cn('overflow-y-auto px-5 pb-5', hasTabs && 'border-t border-border pt-5'))}>
        {tab === 'Overview' &&
        <OverviewTab form={form} columns={columns} onSet={set} onSetCustom={setCustom} kindLabel={kindLabel} idError={idError} titleOnly={isSection} dateErrors={dateErrors} readOnly={!editing} />
        }
        {tab === 'Checklist' &&
        <TaskWorkspaceTab key={task.id} parentType={store.notesType} parentId={task.id} store={store.checklist}
          parentFields={{ [store.scope]: task[store.scope] }} readOnly={!editing}
          onAllCompleteChange={(done) => onSubtasksAllComplete(task, done)} onDirtyChange={setSubtasksDirty} />
        }
        {tab === 'Notes' &&
        <PageNotesTab key={`${task.id}-${editing ? 'edit' : 'view'}`} objectType={store.notesType} objectId={task.id} readOnly={!editing} flush onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
        }
      </div>

      {/* Footer — on Notes only while editing (view mode closes via header or backdrop); there Save Changes
          writes the open note and any edited fields. Unsaved checklist item edits show their own Cancel / Save changes in its place. */}
      {!(tab === 'Notes' && !editing) && !(tab === 'Checklist' && subtasksDirty) && <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
        {editing ? (
          <EditFooterActions dirty={isNew || formDirty || notesDirty} saving={saving || note.saving}
            onCancel={tab === 'Notes' ? () => requestClose(cancelEdit) : cancelEdit}
            onSave={tab === 'Notes' ? () => note.saveThen(() => (formDirty ? (setTab('Overview'), save()) : setIsEditing(false))) : save}
            saveDisabled={!form.title.trim()} saveLabel={isNew ? `Create ${kindLabel}` : undefined} />
        ) : (
          <Button variant="outline" onClick={onClose}>Close</Button>
        )}
      </div>}
    </SlidePane>);

}