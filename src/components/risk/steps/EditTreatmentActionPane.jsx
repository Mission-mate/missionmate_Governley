import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { Input } from '@/components/ui/input';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { Label } from '@/components/ui/label';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import RichTextField from '@/components/risk/RiskRichTextField';
import { sanitizeRiskHtml } from '@/lib/riskHtml';
import DateField from '@/components/ui/DateField';
import ColoredSelect from '@/components/risk/ColoredSelect';
import ProgressBar from '@/components/risk/ProgressBar';
import { cn } from '@/lib/utils';
import { formatReviewDate } from '@/lib/reviewDateUtils';
import {
  RESOLVE_OPTIONS,
  STATUS_OPTIONS,
  STATUS_STYLES,
  progressForStatus,
} from './treatmentConstants';
import SectionCard from '@/components/shared/SectionCard';

function FieldLabel({ children, required, error }) {
  return (
    <Label className={cn('mb-1.5 block text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}{required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

function ViewValue({ value, badgeClass }) {
  if (!value) return <p className="text-sm text-muted-foreground/50">—</p>;
  if (badgeClass) {
    return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', badgeClass)}>{value}</span>;
  }
  return <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>;
}

function Select({ value, options, placeholder, onChange, styleFor, error }) {
  return (
    <ColoredSelect
      value={value ?? ''}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      styleFor={styleFor}
      className={cn('bg-card dark:bg-background', error && 'border-destructive')}
    />
  );
}

export default function EditTreatmentActionPane({ open, action, startInEdit, isNew, onSave, onClose: closeNow }) {
  const [editing, setEditing] = useState(false);
  const [tab, setTab] = useState('overview');
  const [draft, setDraft] = useState(action || {});
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  // Last saved values — drives the dirty state and Cancel.
  const [baseline, setBaseline] = useState(action || {});
  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { draft, notesDirty }, baseline: { draft: baseline, notesDirty: false },
    onClose: closeNow, saving, enabled: open && editing, subject: 'treatment action changes',
  });
  const onClose = () => requestClose();
  const [errors, setErrors] = useState({});
  const dirty = isNew || !draftEqual(draft, baseline);

  useEffect(() => {
    if (open) {
      setDraft(action || {});
      setBaseline(action || {});
      setEditing(!!startInEdit);
      setTab('overview');
      setErrors({});
    }
  }, [open, action?.id, startInEdit]);

  // The saved record refreshes after a save — adopt it while there are no unsaved edits.
  useEffect(() => {
    if (open && action && !dirty) { setDraft(action); setBaseline(action); }
  }, [action]);

  if (!action) return null;

  // Cancel restores the saved values and stays in edit mode; a new action's Cancel closes the pane.
  const cancelEdit = () => (isNew ? onClose() : (setDraft(baseline), setErrors({}), setEditing(false)));

  const set = (fields) => {
    setDraft((d) => ({ ...d, ...fields }));
    setErrors((e) => {
      const next = { ...e };
      Object.keys(fields).forEach((k) => delete next[k]);
      return next;
    });
  };

  const save = async () => {
    const next = {};
    if (!String(draft.title || '').trim()) next.title = true;
    if (!String(draft.owner || '').trim()) next.owner = true;
    if (!draft.resolve_by) next.resolve_by = true;
    if (!draft.status) next.status = true;
    if (Object.keys(next).length) {
      setErrors(next);
      return;
    }
    setSaving(true);
    try {
      // Saved — an existing action stays in edit mode with the saved values as the new baseline.
      if (await onSave(draft)) { setBaseline(draft); if (!isNew) setEditing(false); }
    } finally {
      setSaving(false);
    }
  };

  const progress = Number(draft.progress) || 0;

  return (
    <SlidePane isOpen={open} onClose={onClose}>
      {dialog}
      <div className="flex flex-col h-full bg-card border-l border-border shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {editing ? (isNew ? 'Add Treatment' : 'Edit Treatment') : 'View Treatment'}
            </h2>
            <PaneIconHeaderActions showEdit={!editing} onEdit={() => setEditing(true)} onClose={onClose} />
          </div>
          {!isNew && <ViewModeHint className="mt-1.5" editing={editing} />}

        {/* Tabs — sit above the header divider */}
        <div className="mt-4">
          <CapsuleTabs animated
            value={tab}
            onChange={setTab}
            size="sm"
            className="w-fit"
            tabs={[
              { value: 'overview', label: 'Overview' },
              { value: 'notes', label: 'Action Notes' },
            ]}
          />
        </div>
        </div>

        {/* Body */}
        <div className={cn('flex-1 min-h-0', tab === 'notes' ? 'flex' : 'overflow-y-auto px-5 py-4')}>
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Title + Description */}
              <SectionCard>
                <div>
                  <FieldLabel required={editing} error={errors.title}>Treatment Title</FieldLabel>
                  {editing ? (
                    <Input
                      value={draft.title || ''}
                      onChange={(e) => set({ title: e.target.value })}
                      placeholder="e.g. Implement quarterly access review"
                      className={cn('bg-card dark:bg-background', errors.title && 'border-destructive focus-visible:ring-destructive')}
                    />
                  ) : (
                    <ViewValue value={draft.title} />
                  )}
                </div>
                <div className="mt-4">
                  <FieldLabel>Treatment Description</FieldLabel>
                  {editing ? (
                    <RichTextField
                      value={draft.description || ''}
                      onChange={(v) => set({ description: v })}
                      placeholder="Describe the treatment to be applied to the risk"
                      minHeight={96}
                    />
                  ) : draft.description ? (
                    <div
                      className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                      dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(draft.description) }}
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground/50">—</p>
                  )}
                </div>
              </SectionCard>

              {/* Owner / Resolve By / Status */}
              <SectionCard>
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  <div>
                    <FieldLabel required={editing} error={errors.owner}>Action Owner</FieldLabel>
                    {editing ? (
                      <Input
                        value={draft.owner || ''}
                        onChange={(e) => set({ owner: e.target.value })}
                        placeholder="Responsible person/division"
                        className={cn('bg-card dark:bg-background', errors.owner && 'border-destructive focus-visible:ring-destructive')}
                      />
                    ) : (
                      <ViewValue value={draft.owner} />
                    )}
                  </div>
                  <div>
                    <FieldLabel required={editing} error={errors.resolve_by}>Resolve By</FieldLabel>
                    {editing ? (
                      <Select
                        value={draft.resolve_by}
                        options={RESOLVE_OPTIONS}
                        placeholder="Select..."
                        error={errors.resolve_by}
                        onChange={(v) => set({ resolve_by: v, ...(v !== 'Due Date' ? { due_date: '' } : {}) })}
                      />
                    ) : (
                      <ViewValue value={draft.resolve_by} />
                    )}
                  </div>
                  {draft.resolve_by === 'Due Date' && (
                    <div>
                      <FieldLabel>Due Date</FieldLabel>
                      {editing ? (
                        <DateField value={draft.due_date || ''} onChange={(v) => set({ due_date: v })} inputClassName="bg-card dark:bg-background" />
                      ) : (
                        <ViewValue value={draft.due_date ? formatReviewDate(draft.due_date) : ''} />
                      )}
                    </div>
                  )}
                  <div>
                    <FieldLabel required={editing} error={errors.status}>Status</FieldLabel>
                    {editing ? (
                      <Select
                        value={draft.status}
                        options={STATUS_OPTIONS}
                        placeholder="Select..."
                        error={errors.status}
                        onChange={(v) => {
                          const auto = progressForStatus(v);
                          set({
                            status: v,
                            ...(auto !== null ? { progress: auto } : {}),
                            ...(v !== 'Completed' ? { completion_date: '' } : {}),
                          });
                        }}
                        styleFor={(o) => STATUS_STYLES[o] || ''}
                      />
                    ) : (
                      <ViewValue value={draft.status} badgeClass={STATUS_STYLES[draft.status]} />
                    )}
                  </div>
                </div>
              </SectionCard>

              {/* Progress */}
              <SectionCard>
                <FieldLabel>{`Progress — ${progress}%`}</FieldLabel>
                <ProgressBar
                  value={progress}
                  size="md"
                  showLabel={false}
                  editable={editing}
                  onChange={(v) =>
                    set({
                      progress: Number(v),
                      // Reaching 100% marks the treatment Completed (still manually overridable).
                      ...(Number(v) >= 100 ? { status: 'Completed' } : {}),
                    })
                  }
                />
              </SectionCard>
            </div>
          )}

          {tab === 'notes' && (
            <PageNotesTab
              key={`${action.id}-${editing ? 'edit' : 'view'}`}
              objectType="risk_treatment_action"
              objectId={action.id}
              readOnly={!editing}
              flush
              onDirtyChange={setNotesDirty}
              actionsRef={note.actionsRef}
            />
          )}
        </div>

        {/* Footer — on Notes, Save Changes writes the open note and any edited fields. */}
        {editing && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <EditFooterActions dirty={tab === 'notes' ? notesDirty || dirty : tab === 'overview' && dirty}
              onCancel={tab === 'notes' ? () => requestClose(cancelEdit) : cancelEdit}
              onSave={tab === 'notes' ? () => note.saveThen(() => (dirty ? (setTab('overview'), save()) : setEditing(false))) : save}
              saving={saving || note.saving} saveLabel={isNew ? 'Add Treatment' : undefined} />
          </div>
        )}
      </div>
    </SlidePane>
  );
}