import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SlidePane from '@/components/ui/SlidePane';
import DateField from '@/components/ui/DateField';
import RichTextField from '@/components/risk/RiskRichTextField';
import ColoredSelect from '@/components/risk/ColoredSelect';
import { cn } from '@/lib/utils';
import { REVIEW_OUTCOME_OPTIONS, OUTCOME_STYLES } from './reviewConstants';
import SectionCard from '@/components/shared/SectionCard';
import { localToday } from '@/lib/localClock';
import ViewModeHint from '@/components/shared/ViewModeHint';
import ReviewViewBody from './ReviewViewBody';

function FieldLabel({ children, required }) {
  return (
    <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
      {children}{required && <span className="text-destructive"> *</span>}
    </Label>
  );
}

/**
 * Review side pane — one pane for viewing, editing and logging a review. View → Edit
 * switches in place (like the Treatment pane), so the pane never slides out and back in.
 */
export default function LogRiskReviewPane({ isOpen, onClose: closeNow, onSave, editReview, startInEdit }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [reviewer, setReviewer] = useState('');
  const [outcome, setOutcome] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState({});
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title, date, reviewer, outcome, notes }, baseline, onClose: closeNow, saving,
    enabled: isOpen && editing, subject: 'review changes',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (isOpen) {
      const init = {
        title: editReview?.title || '',
        date: editReview?.date || localToday(),
        reviewer: editReview?.reviewer || '',
        outcome: editReview?.outcome || '',
        notes: editReview?.notes || '',
      };
      setTitle(init.title); setDate(init.date); setReviewer(init.reviewer);
      setOutcome(init.outcome); setNotes(init.notes); setBaseline(init);
      setEditing(!editReview || !!startInEdit);
    }
  }, [isOpen, editReview, startInEdit]);

  // Cancel restores the saved values and returns an existing review to view mode.
  const revert = () => {
    setTitle(baseline.title); setDate(baseline.date); setReviewer(baseline.reviewer);
    setOutcome(baseline.outcome); setNotes(baseline.notes); setEditing(false);
  };
  const handleCancel = () => (editReview ? revert() : onClose());

  const isValid = !!title.trim() && !!outcome && !!date && !!reviewer.trim();
  // A new review can always be saved; an existing one only once it has been edited.
  const dirty = !editReview || !draftEqual({ title, date, reviewer, outcome, notes }, baseline);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave({ id: editReview?.id, title: title.trim(), date, reviewer: reviewer.trim(), outcome, notes });
      // A saved existing review is handed back by the parent and shown in view mode.
      if (!editReview) closeNow();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      {dialog}
      <div className="h-full bg-card shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {editing ? (editReview ? 'Edit Review' : 'Log Review') : 'Review'}
            </h2>
            <PaneIconHeaderActions showEdit={!editing} onEdit={() => setEditing(true)} onClose={onClose} />
          </div>
          {(!editing || !!editReview) && <ViewModeHint className="mt-1.5" editing={editing} />}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!editing ? <ReviewViewBody review={editReview} /> : <>
          <SectionCard>
            <div className="mb-4">
              <FieldLabel required>Review Title</FieldLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Quarter 1, 2028 Risk Review"
                className={cn('bg-card dark:bg-background text-sm')}
              />
            </div>
            <div>
              <FieldLabel required>Review Outcome</FieldLabel>
              <ColoredSelect
                value={outcome}
                onChange={setOutcome}
                options={REVIEW_OUTCOME_OPTIONS}
                placeholder="Select outcome..."
                styleFor={(o) => OUTCOME_STYLES[o] || ''}
                className="bg-card dark:bg-background"
              />
            </div>
            <div className="mt-4">
              <FieldLabel>Review Notes</FieldLabel>
              <RichTextField
                value={notes}
                onChange={setNotes}
                placeholder="Record the review findings and progress"
                minHeight={140}
              />
            </div>
          </SectionCard>

          <SectionCard>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel required>Review Date</FieldLabel>
                <DateField value={date} onChange={setDate} inputClassName="bg-card dark:bg-background" />
              </div>
              <div>
                <FieldLabel required>Reviewer</FieldLabel>
                <Input
                  value={reviewer}
                  onChange={(e) => setReviewer(e.target.value)}
                  placeholder="Reviewer name"
                  className={cn('bg-card dark:bg-background text-sm')}
                />
              </div>
            </div>
          </SectionCard>
          </>}
        </div>

        {/* Footer */}
        {editing && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <EditFooterActions dirty={dirty} onCancel={handleCancel} onSave={handleSave}
              saving={saving} saveDisabled={!isValid} saveLabel={editReview ? undefined : 'Save Review'} />
          </div>
        )}
      </div>
    </SlidePane>
  );
}