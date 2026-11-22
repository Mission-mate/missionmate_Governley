import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import useRecordTabCounts from '@/hooks/useRecordTabCounts';
import SectionCard from '@/components/shared/SectionCard';
import DateField from '@/components/ui/DateField';
import PageNotesTab from '@/components/notes/pages/PageNotesTab';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';

const loadSingleNote = (objectType) => async (id) => (await listNotePages(objectType, id))[0] || null;
import DocumentsTab from '@/components/documents/DocumentsTab';
import { base44 } from '@/api/base44Client';
import { GRANT_OBLIGATIONS } from '@/lib/obligationSources';
import AddDescriptionToggle from '@/components/compliance/assets/AddDescriptionToggle';
import ObligationStatusSelect, { OBLIGATION_STATUS_OPTIONS } from '@/components/grants/ObligationStatusSelect';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

const STATUS_OPTIONS = OBLIGATION_STATUS_OPTIONS;

function FieldLabel({ children, required, error }) {
  return (
    <Label className={cn('mb-1.5 block text-xs font-medium', error ? 'text-destructive' : 'text-muted-foreground')}>
      {children}{required && <span className="text-red-500"> *</span>}
    </Label>
  );
}

function ViewValue({ value, multiline }) {
  const empty = value === undefined || value === null || String(value).trim() === '';
  if (empty) return <p className="text-sm text-muted-foreground/50">—</p>;
  return <p className={cn('text-sm text-foreground', multiline && 'whitespace-pre-wrap')}>{value}</p>;
}

function fmtDate(d) {
  if (!d) return '';
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

export default function ReportingObligationPane({ source = GRANT_OBLIGATIONS, parentId, parentExtra, obligation, currentUser, onClose: closeNow, onSaved, readOnly = false }) {
  const [tab, setTab] = useState('details');
  const counts = useRecordTabCounts(source.objectType, obligation?.id, { notes: 'pane' });
  const req = (k) => !viewMode && source.required.includes(k);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isEditing, setIsEditing] = useState(!readOnly);
  const isEdit = !!obligation;
  // An existing obligation can always return to view-only via Done; a new one stays in edit.
  const viewMode = isEdit && !isEditing;
  const [baseline, setBaseline] = useState({});
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { form, notesDirty }, baseline: { form: baseline, notesDirty: false },
    onClose: closeNow, saving, enabled: !viewMode, subject: 'reporting obligation changes',
  });
  const onClose = () => requestClose();
  const dirty = !isEdit || !draftEqual(form, baseline);
  // Cancel restores the saved values and returns to view-only; a new obligation's Cancel closes the pane.
  const cancelEdit = () => (isEdit ? (setForm(baseline), setErrors({}), setIsEditing(false)) : requestClose());
  // Done returns to view-only (guarded so unsaved note edits are never lost).
  const exitEdit = () => requestClose(() => { setForm(baseline); setErrors({}); setIsEditing(false); });
  const { toast } = useToast();

  useEffect(() => {
    const init = {
      title: obligation?.title || '',
      reporting_type: obligation?.reporting_type || '',
      due_date: obligation?.due_date || '',
      responsible_person: obligation?.responsible_person || '',
      status: obligation?.status || 'not_started',
      description: obligation?.description || '',
    };
    setForm(init); setBaseline(init);
    setErrors({});
    setTab('details');
    setIsEditing(!readOnly);
  }, [obligation?.id]);

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSave = async () => {
    const next = {};
    source.required.forEach((k) => {
      if (!String(form[k] ?? '').trim()) next[k] = true;
    });
    setErrors(next);
    if (Object.keys(next).length) return;

    setSaving(true);
    try {
      const entity = base44.entities[source.entity];
      const payload = { ...form, ...parentExtra, due_date: form.due_date || null, [source.parentField]: parentId };
      if (isEdit) await entity.update(obligation.id, payload);
      else await entity.create(payload);
    } catch {
      // Keep the pane open with the form intact so the user can retry.
      toast({
        title: 'Could not save reporting obligation',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    } finally {
      setSaving(false);
    }
    onSaved();
    // Saved — an existing obligation returns to view-only with the saved values as the new baseline.
    if (isEdit) { setBaseline(form); setIsEditing(false); }
    else closeNow();
  };

  const statusOpt = STATUS_OPTIONS.find((s) => s.value === form.status);

  return (
    <SlidePane isOpen onClose={onClose}>
      {dialog}
      <div
        className="h-full bg-white border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">
                {`${viewMode ? 'View' : isEdit ? 'Edit' : 'Add'} ${source.itemLabel || 'Reporting Obligation'}`}
              </h2>
              <PaneIconHeaderActions showEdit={viewMode} onEdit={() => setIsEditing(true)} onClose={onClose} />
            </div>
            {isEdit && <ViewModeHint className="mt-1.5" editing={!viewMode} />}

          {/* Tabs — sit above the header divider */}
          {isEdit && (
            <div className="mt-4">
              <CapsuleTabs animated
                value={tab}
                onChange={setTab}
                className="w-fit"
                size="sm"
                tabs={[
                  { value: 'details', label: 'Overview' },
                  { value: 'notes', label: 'Notes', count: counts.notes },
                  { value: 'documents', label: 'Documents', count: counts.documents },
                ]}
              />
            </div>
          )}
          
          </div>

          {/* Content */}
          <div className={cn('flex-1 min-h-0', tab === 'notes' ? 'flex' : 'overflow-y-auto px-5 py-4')}>
            {tab === 'details' && (
              <div className="space-y-4">
                <SectionCard>
                  <FieldLabel required={req('title')} error={errors.title}>Obligation Title</FieldLabel>
                  {viewMode ? (
                    <>
                      <ViewValue value={form.title} />
                      {form.description && (
                        <div className="mt-4">
                          <Label className="text-xs font-semibold text-muted-foreground block mb-1.5">Description</Label>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{form.description}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <Input
                      value={form.title || ''}
                      onChange={(e) => { set('title', e.target.value); if (errors.title) setErrors((p) => ({ ...p, title: false })); }}
                      placeholder="e.g. Final acquittal report"
                      className={cn('bg-white', errors.title && 'border-destructive focus-visible:ring-destructive')}
                    />
                  )}
                  {!viewMode && (
                    <div className="mt-4 flex">
                      <AddDescriptionToggle className="w-full" value={form.description} onChange={(v) => set('description', v)} placeholder="Describe the obligation or milestone..." />
                    </div>
                  )}
                </SectionCard>

                <SectionCard title="Obligation Details">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                    <div>
                      <FieldLabel required={req('reporting_type')} error={errors.reporting_type}>Type</FieldLabel>
                      {viewMode ? <ViewValue value={form.reporting_type} /> : (
                        <Input
                          value={form.reporting_type || ''}
                          onChange={(e) => { set('reporting_type', e.target.value); if (errors.reporting_type) setErrors((p) => ({ ...p, reporting_type: false })); }}
                          placeholder="e.g. Audited Report"
                          className={cn('bg-white', errors.reporting_type && 'border-destructive focus-visible:ring-destructive')}
                        />
                      )}
                    </div>
                    <div>
                      <FieldLabel required={req('due_date')} error={errors.due_date}>Due Date</FieldLabel>
                      {viewMode ? <ViewValue value={fmtDate(form.due_date)} /> : (
                        <div className={cn(errors.due_date && 'rounded-md ring-1 ring-destructive')}>
                          <DateField
                            value={form.due_date || ''}
                            onChange={(v) => { set('due_date', v); if (errors.due_date) setErrors((p) => ({ ...p, due_date: false })); }}
                            inputClassName="bg-white"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <FieldLabel>Responsible Person</FieldLabel>
                      {viewMode ? <ViewValue value={form.responsible_person} /> : (
                        <Input
                          value={form.responsible_person || ''}
                          onChange={(e) => set('responsible_person', e.target.value)}
                          placeholder="e.g. David James"
                          className="bg-white"
                        />
                      )}
                    </div>
                    <div>
                      <FieldLabel required={req('status')} error={errors.status}>Status</FieldLabel>
                      {viewMode ? (
                        statusOpt
                          ? <span className={cn('inline-block px-2 py-0.5 rounded text-xs font-medium', statusOpt.badge)}>{statusOpt.label}</span>
                          : <ViewValue value="" />
                      ) : (
                        <ObligationStatusSelect
                          value={form.status || 'not_started'}
                          onChange={(v) => { set('status', v); if (errors.status) setErrors((p) => ({ ...p, status: false })); }}
                          error={errors.status}
                        />
                      )}
                    </div>
                  </div>
                </SectionCard>
              </div>
            )}

            {tab === 'notes' && obligation?.id && (
              source.singleNotePage ? (
                <SinglePageDocument
                  key={`${obligation.id}-${viewMode ? 'view' : 'edit'}`}
                  objectType={source.objectType}
                  objectId={obligation.id}
                  queryKey={['notePages', source.objectType, obligation.id, 'single']}
                  loadPage={loadSingleNote(source.objectType)}
                  defaultTitle="Notes"
                  breadcrumbRoot={obligation.title || 'Obligation'}
                  readOnly={viewMode}
                  flush
                  onDirtyChange={setNotesDirty}
                  actionsRef={note.actionsRef}
                  errorLabel="notes"
                />
              ) : (
                <PageNotesTab key={`${obligation.id}-${viewMode ? 'view' : 'edit'}`} objectType={source.objectType} objectId={obligation.id} readOnly={viewMode} flush onDirtyChange={setNotesDirty} actionsRef={note.actionsRef} />
              )
            )}

            {tab === 'documents' && obligation?.id && (
              <DocumentsTab objectType={source.objectType} objectId={obligation.id} currentUser={currentUser} hideTitle readOnly={viewMode} compact />
            )}
          </div>

          {/* Footer */}
          {tab === 'details' ? (
            <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
              {viewMode ? (
                <Button variant="outline" onClick={onClose}>Close</Button>
              ) : (
                <EditFooterActions dirty={dirty} onCancel={cancelEdit} onSave={handleSave}
                  saving={saving} saveLabel={isEdit ? undefined : 'Add Obligation'} />
              )}
            </div>
          ) : (
            // On Notes, Save Changes writes the open note and any edited fields.
            !viewMode && (
              <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
                {tab === 'notes'
                  ? <EditFooterActions dirty={notesDirty || dirty} onCancel={exitEdit} saving={saving || note.saving}
                      onSave={() => note.saveThen(() => (dirty ? (setTab('details'), handleSave()) : setIsEditing(false)))} />
                  : <EditFooterActions dirty={false} onCancel={exitEdit} />}
              </div>
            )
          )}
      </div>
    </SlidePane>
  );
}