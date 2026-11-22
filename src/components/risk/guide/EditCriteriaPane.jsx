import React, { useState, useEffect } from 'react';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { Textarea } from '@/components/ui/textarea';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

// Edit pane for the System Assessment Criteria. Category names are locked —
// only the criteria text per category can be edited.
export default function EditCriteriaPane({ isOpen, onClose, title, rows = [], onSave }) {
  const [draft, setDraft] = useState(rows);
  const [baseline, setBaseline] = useState(rows);
  const [saving, setSaving] = useState(false);

  // Re-sync the draft whenever a fresh set of rows is opened.
  useEffect(() => {
    if (isOpen) { setDraft(rows.map((r) => ({ ...r }))); setBaseline(rows.map((r) => ({ ...r }))); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft, baseline, onClose, saving, enabled: isOpen,
    select: (list) => (list || []).map((r) => r.criteria),
  });

  const dirty = !draftEqual(draft.map((r) => r.criteria), baseline.map((r) => r.criteria));

  const updateRow = (idx, criteria) =>
    setDraft((prev) => prev.map((r, i) => (i === idx ? { ...r, criteria } : r)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="h-full bg-card border-l border-border flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Edit {title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Category names are fixed — edit the assessment criteria for each.
            </p>
          </div>
          <CloseButton onClick={requestClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {draft.map((row, idx) => (
            <div key={row.name}>
              <p className="text-sm font-semibold text-foreground mb-1.5">{row.name}</p>
              <Textarea
                value={row.criteria}
                onChange={(e) => updateRow(idx, e.target.value)}
                placeholder="Assessment criteria…"
                className="min-h-[96px] resize-y text-sm"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
          <EditFooterActions dirty={dirty} onCancel={requestClose} onSave={handleSave} saving={saving} />
        </div>
      </div>
    </SlidePane>
    {dialog}
    </>
  );
}