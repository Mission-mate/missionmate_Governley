import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import SectionCard from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import DateField from '@/components/ui/DateField';
import StatusSelect from '@/components/grants/detail/financials/StatusSelect';
import CurrencyInput from '@/components/grants/detail/financials/CurrencyInput';
import AmountError from '@/components/grants/detail/financials/AmountError';
import StatusPill from '@/components/grants/detail/financials/StatusPill';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { parseAmount, fmtCurrency } from '@/lib/financials';
import { format, parseISO } from 'date-fns';
import RichTextField from '@/components/shared/RichTextField';
import { cn } from '@/lib/utils';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import DiscardChangesDialog from '@/components/shared/DiscardChangesDialog';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';

function fmtDate(d) {
  try { return format(parseISO(d), 'dd MMM yyyy'); } catch { return d; }
}

const AMOUNT_ERROR = 'Enter a valid amount — numbers only, zero or greater.';

/**
 * Right-side pane for a single FinancialEntry row. Existing rows open
 * read-only (pencil to edit); new rows (entry = null) open editable.
 * `fields` = [{ key, label, type: 'text' | 'richtext' | 'currency' | 'date' | 'status', half?: boolean, placeholder? }]
 * Fields span the full width unless `half` is set (two-column grid).
 */
export default function FinancialEntryPane({ isOpen, entry, title, viewTitle, subtitle, fields, onClose: closeNow, onSave, startEditing = false, NotesTab = null }) {
  const [tab, setTab] = useState('overview');
  const [notesDirty, setNotesDirty] = useState(false);
  const [confirmNotes, setConfirmNotes] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [amountErrors, setAmountErrors] = useState({});
  const [baseline, setBaseline] = useState({});
  const [isEditing, setIsEditing] = useState(!entry);
  const viewMode = !!entry && !isEditing;
  const showTabs = !!NotesTab && !!entry;
  const onNotes = showTabs && tab === 'notes';
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose: closeNow, saving, enabled: isOpen && !viewMode, subject: 'financial entry changes',
  });
  const exitEdit = () => { setForm(baseline); setAmountErrors({}); setIsEditing(false); };
  // While editing an existing row, dismissing reverts to view mode instead of closing.
  const onClose = () => (onNotes
    ? (notesDirty ? setConfirmNotes(true) : closeNow())
    : entry && isEditing
    ? requestClose(exitEdit)
    : requestClose());
  const dirty = !entry || !draftEqual(form, baseline);
  // Cancel restores the saved values and returns to view mode; a new row's Cancel closes the pane.
  const cancelEdit = () => (entry ? exitEdit() : requestClose());

  useEffect(() => {
    if (isOpen) {
      const next = {};
      fields.forEach((f) => {
        const fallback = f.type === 'status' ? 'scheduled' : '';
        next[f.key] = entry?.[f.key] ?? fallback;
      });
      setForm(next);
      setBaseline(next);
      setAmountErrors({});
      setIsEditing(!entry || startEditing);
      setTab('overview');
      setNotesDirty(false);
      setNotesEditing(false);
    }
  }, [isOpen, entry]);

  const renderValue = (f) => {
    const v = form[f.key];
    if (f.type === 'status') return <StatusPill status={v || 'scheduled'} />;
    if (v === undefined || v === null || String(v).trim() === '') return <p className="text-sm text-muted-foreground/50">—</p>;
    if (f.type === 'richtext') {
      return (
        <div
          className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
          dangerouslySetInnerHTML={{ __html: v }}
        />
      );
    }
    const text = f.type === 'currency' ? fmtCurrency(v) : f.type === 'date' ? fmtDate(v) : v;
    return <p className="text-sm text-foreground">{text}</p>;
  };

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setAmountErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  // Switching tabs: Notes requires funding edits to be saved first; Overview
  // still guards unsaved note edits.
  const changeTab = async (v) => {
    if (v === tab) return;
    if (v === 'overview') { if (notesDirty) setConfirmNotes('tab'); else { setNotesEditing(false); setTab(v); } return; }
    if (isEditing) {
      if (dirty && !(await handleSave())) return;
      setIsEditing(false);
    }
    setTab('notes');
  };

  // Returns true on success. An existing row saves in place and stays in edit mode
  // with the saved values as the new baseline; a new row closes once added.
  const handleSave = async () => {
    // Validate every currency field before building the payload — an invalid
    // amount must never be sent, and the pane stays open with the edits intact.
    const patch = {};
    const nextErrors = {};
    fields.forEach((f) => {
      if (f.type === 'currency') {
        const parsed = parseAmount(form[f.key]);
        if (parsed === null) nextErrors[f.key] = AMOUNT_ERROR;
        else patch[f.key] = parsed;
      } else {
        patch[f.key] = form[f.key];
      }
    });

    if (Object.keys(nextErrors).length) {
      setAmountErrors(nextErrors);
      return false;
    }

    setAmountErrors({});
    setSaving(true);
    try {
      await onSave(patch);
      if (entry) { setForm(patch); setBaseline(patch); setIsEditing(false); } else closeNow();
      return true;
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <DiscardChangesDialog
        isOpen={confirmNotes}
        onClose={() => setConfirmNotes(false)}
        onConfirm={() => { setConfirmNotes(false); setNotesDirty(false); setNotesEditing(false); if (tab === 'notes' && confirmNotes === 'tab') setTab('overview'); else closeNow(); }}
      />
      <div className="h-full bg-white dark:bg-card flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">{viewMode ? viewTitle : title}</h2>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>}
            {!!entry && <ViewModeHint className="mt-1.5" editing={isEditing || (onNotes && notesEditing)} />}
            {showTabs && (
              <CapsuleTabs animated
                value={tab}
                onChange={changeTab}
                size="sm"
                className="w-fit mt-4"
                tabs={[{ value: 'overview', label: 'Overview' }, { value: 'notes', label: 'Notes' }]}
              />
            )}
          </div>
          <PaneIconHeaderActions showEdit={viewMode && (!onNotes || !notesEditing)} onEdit={() => (onNotes ? setNotesEditing(true) : setIsEditing(true))} onClose={onClose} />
        </div>

        {/* Body */}
        {onNotes ?
        <div className="flex-1 min-h-0"><NotesTab entry={entry} readOnly={!notesEditing} onDirtyChange={setNotesDirty} /></div> :
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <SectionCard className="grid grid-cols-2 gap-x-3 gap-y-4">
          {fields.map((f) =>
            <div key={f.key} className={cn('min-w-0', !f.half && 'col-span-2')}>
              <p className="text-sm mb-1.5 [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-medium text-[hsl(var(--foreground))]">{f.label}</p>
              {viewMode ? renderValue(f) :
              f.type === 'date' ?
              <DateField value={form[f.key] || ''} onChange={(v) => set(f.key, v)} placeholder="DD MMM YYYY" /> :
              f.type === 'status' ?
              <StatusSelect value={form[f.key] || 'scheduled'} onChange={(v) => set(f.key, v)} /> :
              f.type === 'currency' ?
              <>
                <CurrencyInput value={form[f.key] ?? ''} onChange={(v) => set(f.key, v)} />
                <AmountError message={amountErrors[f.key]} />
              </> :
              f.type === 'richtext' ?
              <RichTextField
                value={form[f.key] || ''}
                onChange={(v) => set(f.key, v)}
                placeholder={f.placeholder || f.label}
                minHeight={120} /> :

              <Input
                value={form[f.key] || ''}
                onChange={(e) => set(f.key, e.target.value)}
                className="text-sm bg-white dark:bg-card"
                placeholder={f.placeholder || f.label} />

              }
            </div>
            )}
          </SectionCard>
        </div>
        }

        {/* Footer */}
        {/* Dirty notes show their own Cancel / Save changes in place of this footer. */}
        {!(onNotes && notesDirty) &&
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          {viewMode ?
          <Button variant="outline" onClick={onClose}>Close</Button> :
          <EditFooterActions dirty={dirty} onCancel={cancelEdit} onSave={handleSave}
            saving={saving} />
          }
        </div>
        }
      </div>
    </SlidePane>);

}