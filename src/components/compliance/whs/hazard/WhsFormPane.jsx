import React, { useState, useEffect } from 'react';
import { Loader2, SquarePen } from 'lucide-react';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { Button } from '@/components/ui/button';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import WhsFormField from './WhsFormField';
import WhsFieldValue from './WhsFieldValue';
import useWhsFieldErrors from './useWhsFieldErrors';

/**
 * Side-pane form for WHS records, styled like the Fixed Asset Register's Add pane.
 * Pass `sections` ([{ title, fields }]) for titled section cards, or `fields` for a single card.
 * `readOnly` renders a view with the shared guide line; `onEdit` switches it to editing.
 * Unsaved edits are guarded by the shared "Discard changes?" dialog.
 */
export default function WhsFormPane({ open, title, fields, sections, initial, onSave, onClose, readOnly = false, onEdit, editIcon = SquarePen, editLabel = 'Edit' }) {
  const EditIcon = editIcon;
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempted, setAttempted] = useState(false);
  useEffect(() => { if (open) { setDraft(initial || {}); setError(''); setSaving(false); setAttempted(false); } }, [open, initial, readOnly]);
  const guard = useUnsavedChanges({ draft, baseline: initial || {}, onClose, enabled: open && !readOnly, saving });

  const groups = sections || [{ title: 'Details', fields }];
  const all = groups.flatMap((g) => g.fields);
  // Recalculate derived fields (e.g. Next Review Date) after every edit.
  const withComputed = (d) => all.reduce((acc, f) => (f.compute ? { ...acc, [f.key]: f.compute(acc) } : acc), d);
  const visibleFields = all.filter((f) => !f.when || f.when(draft));
  const { errors, blocked } = useWhsFieldErrors(readOnly ? [] : visibleFields, draft, initial?.id, attempted);
  const submit = async () => {
    setAttempted(true);
    if (blocked) return;
    setSaving(true);
    setError('');
    try { await onSave(draft); } catch (e) { setError(e.message || 'Could not save.'); setSaving(false); }
  };

  return (
    <SlidePane isOpen={open} onClose={guard.requestClose}>
      <div className="bg-card h-full flex flex-col shadow-2xl">
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-foreground break-words">{title}</h2>
            {readOnly ? <ViewModeHint className="mt-1" icon={EditIcon} /> : !!initial?.id && <ViewModeHint className="mt-1" editing />}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {readOnly && onEdit && (
              <button onClick={onEdit} aria-label={editLabel} title={editLabel}
                className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                <EditIcon className="w-4 h-4" />
              </button>
            )}
            <CloseButton onClick={guard.requestClose} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {groups.map((g) => (
            <section key={g.title} className="rounded-xl bg-muted p-5 [&_input]:bg-card [&_textarea]:bg-card [&_button]:bg-card">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{g.title}
                {g.subtitle && <span className="block mt-1 text-xs font-normal normal-case tracking-normal">{g.subtitle}</span>}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {g.fields.filter((f) => !f.when || f.when(draft)).map((f) => (readOnly
                  ? <WhsFieldValue key={f.key} field={f} value={draft[f.key]} status={draft.status} />
                  : <WhsFormField key={f.key} field={f} value={draft[f.key]} error={errors[f.key]} onChange={(v) => setDraft((d) => withComputed({ ...d, [f.key]: v }))} />
                ))}
              </div>
            </section>
          ))}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        {!readOnly && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={guard.requestClose}>Cancel</Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save'}
            </Button>
          </div>
        )}
      </div>
      {guard.dialog}
    </SlidePane>
  );
}