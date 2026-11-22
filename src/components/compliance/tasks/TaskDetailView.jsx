import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { ChevronLeft, Trash2, User, Calendar as CalendarIcon, CircleDashed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { statusOf } from '@/lib/obligationTasks';
import TaskPropertyRow from './TaskPropertyRow';
import TaskOwnerField from './TaskOwnerField';
import TaskDueDatePicker from './TaskDueDatePicker';
import TaskStatusPicker from './TaskStatusPicker';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import NoteQuillEditor from '@/components/notes/pages/NoteQuillEditor';
import { cn } from '@/lib/utils';

// Quill emits an empty paragraph for a blank document — treat it as no description.
const cleanHtml = (html) => (html === '<p><br></p>' ? '' : html || '');

const FIELDS = ['title', 'owner_name', 'due_date', 'status', 'description'];

const baselineOf = (task) => ({
  title: task.title || '',
  owner_name: task.owner_name || '',
  due_date: task.due_date || '',
  status: statusOf(task),
  description: task.description || '',
});

/** Drill-in detail. Edits are held as a draft — Cancel / Save Changes appear while dirty (mirrors Notes). */
export default function TaskDetailView({ task, readOnly, onBack, onUpdate, onDelete, onDirtyChange }) {
  const [baseline, setBaseline] = useState(() => baselineOf(task));
  const [draft, setDraft] = useState(() => baselineOf(task));
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  // The editor is uncontrolled; bumping this remounts it from the baseline on Cancel.
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => { const b = baselineOf(task); setBaseline(b); setDraft(b); }, [task.id]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const dirty = !readOnly && FIELDS.some((k) => draft[k] !== baseline[k]);
  useEffect(() => { onDirtyChange?.(dirty); }, [dirty, onDirtyChange]);

  const handleSave = guardSave(setSaving, async () => {
    const next = { ...draft, title: draft.title.trim() || baseline.title, owner_name: draft.owner_name.trim() };
    const patch = {};
    FIELDS.forEach((k) => { if (next[k] !== baseline[k]) patch[k] = next[k]; });
    setSaving(true);
    await onUpdate(task.id, patch);
    setSaving(false);
    setBaseline(next);
    setDraft(next);
  });

  const handleCancel = () => { setDraft({ ...baseline }); setResetKey((k) => k + 1); };

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      {/* Breadcrumb — mirrors the Notes "All notes" back bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border shrink-0 text-sm min-w-0">
        <button
          type="button"
          onClick={onBack}
          disabled={dirty}
          title={dirty ? 'Save or cancel your changes first' : undefined}
          className="flex items-center gap-1 font-semibold text-foreground hover:text-primary transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-foreground"
        >
          <ChevronLeft className="w-4 h-4" /> All Tasks
        </button>
        {!readOnly && (
          <button type="button" onClick={() => setConfirm(true)} title="Delete task" className="ml-auto p-1.5 -my-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">

        {readOnly ? (
          <h2 className="text-base font-semibold text-foreground break-words">{task.title}</h2>
        ) : (
          <AutoGrowTextarea
            value={draft.title}
            onChange={(e) => set({ title: e.target.value })}
            onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
            placeholder="Task title"
            className="border-0 rounded-none bg-transparent p-0 shadow-none focus-visible:ring-0 text-base font-semibold text-foreground break-words placeholder:text-muted-foreground/40"
          />
        )}

        <div className="mt-5 grid grid-cols-3 gap-6">
          <TaskPropertyRow icon={User} label="Owner">
            <TaskOwnerField value={draft.owner_name} onChange={(owner_name) => set({ owner_name })} readOnly={readOnly} />
          </TaskPropertyRow>
          <TaskPropertyRow icon={CalendarIcon} label="Due date">
            <TaskDueDatePicker value={draft.due_date} onChange={(due_date) => set({ due_date: due_date || '' })} readOnly={readOnly} />
          </TaskPropertyRow>
          <TaskPropertyRow icon={CircleDashed} label="Status">
            <TaskStatusPicker value={draft.status} onChange={(status) => set({ status })} readOnly={readOnly} />
          </TaskPropertyRow>
        </div>

        <div className={cn('mt-5 flex flex-col', readOnly && 'pointer-events-none')}>
          <NoteQuillEditor
            key={`${task.id}-${resetKey}-${readOnly ? 'ro' : 'rw'}`}
            value={baseline.description}
            onChange={(html) => set({ description: cleanHtml(html) })}
            readOnly={readOnly}
          />
        </div>
      </div>

      {dirty && (
        <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-2 shrink-0">
          <Button variant="outline" onClick={handleCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      )}

      <ConfirmDeleteDialog
        isOpen={confirm}
        title="Delete Task"
        message="Permanently delete this task? This cannot be recovered."
        onConfirm={async () => { await onDelete(task.id); setConfirm(false); }}
        onClose={() => setConfirm(false)}
      />
    </div>
  );
}