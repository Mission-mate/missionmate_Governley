import React, { useState, useEffect } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import DocumentsTab from '@/components/documents/DocumentsTab';
import TaskWorkspaceTab from '@/components/compliance/tasks/TaskWorkspaceTab';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import DecisionOverviewFields from '@/components/board/decisions/DecisionOverviewFields';
import { createDecision, updateDecision } from '@/lib/decisionRegisterApi';
import { base44 } from '@/api/base44Client';
import { toast } from '@/components/ui/use-toast';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import useNoteActions from '@/hooks/useNoteActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { cn } from '@/lib/utils';

// Checklist, notes and documents are scoped to this key, so they never mix with meeting actions.
const SCOPE = 'decision';
const VOTE_KEYS = ['votes_for', 'votes_against', 'votes_abstained'];

// meeting_name and meeting_date are read from the linked Meeting and never stored.
const EMPTY_FORM = {
  decision_type: 'Decision', title: '', minuted_text: '',
  meeting_id: '', meeting_name: '', meeting_date: '', agenda_item: '',
  outcome: '', decision_date: '',
  mover: '', seconder: '', votes_for: '', votes_against: '', votes_abstained: '',
  disposition: 'No', earlier_decision_id: '',
};

const toForm = (decision) => Object.fromEntries(
  Object.keys(EMPTY_FORM).map((key) => [key, String(decision[key] ?? '') || EMPTY_FORM[key]])
);

export default function DecisionFormPane({ register, decision, allDecisions = [], onClose, onSaved, readOnly = false }) {
  const isEdit = !!decision;
  const [tab, setTab] = useState('details');
  const counts = useRecordTabCounts(SCOPE, decision?.id, { notes: 'pane', tasks: 'workspace' });
  const [form, setForm] = useState(EMPTY_FORM);
  const [baseline, setBaseline] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  // View panes open read-only; a pencil switches them into edit mode.
  const [isEditing, setIsEditing] = useState(!readOnly);
  const viewMode = isEdit && !isEditing;
  const [currentUser, setCurrentUser] = useState(null);

  const [notesDirty, setNotesDirty] = useState(false);
  const [tasksDirty, setTasksDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, notesDirty, tasksDirty }, baseline: { form: baseline, notesDirty: false, tasksDirty: false },
    onClose, saving, enabled: !viewMode, subject: 'decision changes',
  });
  const dirty = !draftEqual(form, baseline);
  const restore = () => { setForm(baseline); setErrors({}); setIsEditing(false); };
  // Cancel restores the saved values and returns to view-only; a new decision's Cancel closes the pane.
  const cancelEdit = () => (isEdit ? restore() : requestClose());
  // Done returns to view-only (guarded so unsaved note/checklist edits are never lost).
  const exitEdit = () => requestClose(restore);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
  }, []);

  useEffect(() => {
    const initial = decision ? toForm(decision) : EMPTY_FORM;
    setForm(initial);
    setBaseline(initial);
    setErrors({});
    setTab('details');
    setIsEditing(!readOnly);
  }, [decision?.id]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: false }));
  };

  // Linking a meeting fills its date and the decision date; the decision date stays editable.
  const setMeeting = (meeting) => setForm((f) => ({
    ...f,
    meeting_id: meeting?.id || '',
    meeting_name: meeting?.title || '',
    meeting_date: meeting?.meeting_date || '',
    decision_date: meeting?.meeting_date || f.decision_date,
  }));

  const handleSave = async () => {
    const isResolution = form.decision_type === 'Resolution';
    const replaces = form.disposition !== 'No';
    const nextErrors = {};
    if (!form.title.trim()) nextErrors.title = true;
    if (replaces && !form.earlier_decision_id) nextErrors.earlier_decision_id = true;
    if (isResolution) VOTE_KEYS.forEach((key) => { if (!/^\d*$/.test(form[key])) nextErrors[key] = true; });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Motion and vote details only belong to a resolution; an earlier decision only to a replacement.
    const count = (value) => (isResolution && value !== '' ? Number(value) : null);
    const payload = {
      decision_type: form.decision_type,
      title: form.title.trim(),
      minuted_text: form.minuted_text,
      meeting_id: form.meeting_id,
      agenda_item: form.agenda_item,
      outcome: form.outcome,
      decision_date: form.decision_date,
      mover: isResolution ? form.mover : '',
      seconder: isResolution ? form.seconder : '',
      votes_for: count(form.votes_for),
      votes_against: count(form.votes_against),
      votes_abstained: count(form.votes_abstained),
      disposition: form.disposition,
      earlier_decision_id: replaces ? form.earlier_decision_id : '',
    };

    setSaving(true);
    try {
      if (isEdit) await updateDecision(decision.id, payload);
      else await createDecision(register.id, payload);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: isEdit ? 'Could not save decision' : 'Could not add decision',
        description: err?.message || 'Something went wrong. Please try again.',
      });
      return;
    } finally {
      setSaving(false);
    }
    onSaved();
    // Saved: an existing decision returns to view-only with the saved values as the new baseline.
    if (isEdit) { setBaseline(form); setIsEditing(false); }
    else onClose();
  };

  return (
    <>
      {dialog}
      <SlidePane isOpen onClose={requestClose}>
        <div className="h-full bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {viewMode ? 'View Decision' : isEdit ? 'Edit Decision' : 'Add Decision'}
              </h2>
              <PaneIconHeaderActions showEdit={viewMode} onEdit={() => setIsEditing(true)} onClose={() => requestClose()} />
            </div>
            {isEdit
              ? <ViewModeHint className="mt-1.5" editing={!viewMode} />
              : <p className="mt-1 text-sm text-muted-foreground">Record a key decision or resolution from a meeting.</p>}
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
                  ]} />
              </div>
            )}
          </div>

          <div className={cn('flex-1 min-h-0', tab === 'notes' || tab === 'tasks' ? 'flex' : 'overflow-y-auto px-5 py-4')}>
            {tab === 'details' && (
              <DecisionOverviewFields
                form={form}
                set={set}
                setMeeting={setMeeting}
                errors={errors}
                viewMode={viewMode}
                candidates={allDecisions.filter((d) => d.id !== decision?.id)}
                replacedBy={isEdit ? allDecisions.filter((d) => d.earlier_decision_id === decision.id) : []} />
            )}
            {tab === 'tasks' && isEdit && (
              <TaskWorkspaceTab key={decision.id} parentType={SCOPE} parentId={decision.id} readOnly={viewMode} onDirtyChange={setTasksDirty} />
            )}
            {tab === 'notes' && isEdit && (
              <PageNotesTab key={`${decision.id}-${viewMode ? 'view' : 'edit'}`} objectType={SCOPE} objectId={decision.id} readOnly={viewMode} flush onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
            )}
            {tab === 'documents' && isEdit && (
              <DocumentsTab objectType={SCOPE} objectId={decision.id} currentUser={currentUser} hideTitle readOnly={viewMode} compact />
            )}
          </div>

          {tab === 'details' && (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {viewMode
                ? <Button variant="outline" onClick={onClose} className="ml-auto">Close</Button>
                : <EditFooterActions dirty={!isEdit || dirty} onCancel={cancelEdit} onSave={handleSave}
                    saving={saving} saveLabel={isEdit ? undefined : 'Add Decision'} />}
            </div>
          )}

          {/* Notes/Checklist/Documents tabs (edit mode only): Cancel returns to view-only.
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