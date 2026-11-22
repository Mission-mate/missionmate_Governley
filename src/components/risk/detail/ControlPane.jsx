import React, { useState, useEffect } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { Info } from 'lucide-react';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import SlidePane from '@/components/ui/SlidePane';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { Input } from '@/components/ui/input';
import EditFooterActions from '@/components/shared/EditFooterActions';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import RichTextField from '@/components/risk/RiskRichTextField';
import { sanitizeRiskHtml } from '@/lib/riskHtml';
import ColoredSelect from '@/components/risk/ColoredSelect';
import { cn } from '@/lib/utils';
import {
  EFFECTIVENESS_OPTIONS,
  EFFECTIVENESS_STYLES,
  EFFECTIVENESS_HELP,
} from './controlConstants';
import SectionCard from '@/components/shared/SectionCard';

function FieldLabel({ children }) {
  return (
    <Label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      {children}
    </Label>
  );
}

function InfoTooltip({ text }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="text-muted-foreground/70 hover:text-foreground">
            <Info className="w-3.5 h-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[220px] text-xs z-[200]">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ViewValue({ value, badgeClass }) {
  if (!value) return <p className="text-sm text-muted-foreground/50">—</p>;
  if (badgeClass) {
    return <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-medium', badgeClass)}>{value}</span>;
  }
  return <p className="text-sm text-foreground whitespace-pre-wrap">{value}</p>;
}

export default function ControlPane({ open, control, startInEdit, isNew, onSave, onClose: closeNow }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(control || {});
  // Last saved values — drives the dirty state and Cancel.
  const [baseline, setBaseline] = useState(control || {});
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({
    draft, baseline, onClose: closeNow, saving, enabled: open && editing, subject: 'control changes',
  });
  const onClose = () => requestClose();

  useEffect(() => {
    if (open) {
      setDraft(control || {});
      setBaseline(control || {});
      setEditing(!!startInEdit);
      setShowErrors(false);
    }
  }, [open, control?.id, startInEdit]);

  if (!control) return null;

  const set = (fields) => setDraft((d) => ({ ...d, ...fields }));
  const titleMissing = !(draft.control || '').trim();
  const dirty = isNew || !draftEqual(draft, baseline);
  // Cancel restores the saved values and stays in edit mode; a new control's Cancel closes the pane.
  const cancelEdit = () => (isNew ? onClose() : (setDraft(baseline), setShowErrors(false), setEditing(false)));
  const save = async () => {
    if (titleMissing) { setShowErrors(true); return; }
    const payload = {
      ...draft,
      design_effectiveness: draft.design_effectiveness || 'Not Assessed',
      operating_effectiveness: draft.operating_effectiveness || 'Not Assessed',
    };
    setSaving(true);
    try {
      // Saved — an existing control returns to view-only with the saved values as the new baseline.
      if (await onSave(payload)) { setDraft(payload); setBaseline(payload); if (!isNew) setEditing(false); }
    } finally {
      setSaving(false);
    }
  };

  return (
    <SlidePane isOpen={open} onClose={onClose}>
      {dialog}
      <div className="flex flex-col h-full bg-card border-l border-border shadow-xl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              {editing ? (isNew ? 'Add Control' : 'Edit Control') : 'View Control'}
            </h2>
            <PaneIconHeaderActions showEdit={!editing} onEdit={() => setEditing(true)} onClose={onClose} />
          </div>
          {!isNew && <ViewModeHint className="mt-1.5" editing={editing} />}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name + Description */}
          <SectionCard>
            <div>
              <FieldLabel>Control Title {editing && <span className="text-destructive">*</span>}</FieldLabel>
              {editing ? (
                <Input
                  value={draft.control || ''}
                  onChange={(e) => set({ control: e.target.value })}
                  placeholder="Enter a control title"
                  className={cn('bg-card dark:bg-background', showErrors && titleMissing && 'border-destructive')}
                />
              ) : (
                <ViewValue value={draft.control} />
              )}
            </div>
            <div className="mt-4">
              <FieldLabel>Control Description</FieldLabel>
              {editing ? (
                <RichTextField
                  value={draft.description || ''}
                  onChange={(v) => set({ description: v })}
                  placeholder="Describe the control"
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

          {/* Effectiveness */}
          <SectionCard>
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              <div>
                <FieldLabel>
                  Design Effectiveness {editing && <span className="text-destructive">*</span>} <InfoTooltip text={EFFECTIVENESS_HELP.design} />
                </FieldLabel>
                {editing ? (
                  <ColoredSelect
                    value={draft.design_effectiveness || 'Not Assessed'}
                    onChange={(v) => set({ design_effectiveness: v })}
                    options={EFFECTIVENESS_OPTIONS}
                    styleFor={(o) => EFFECTIVENESS_STYLES[o] || ''}
                    className="bg-card dark:bg-background"
                  />
                ) : (
                  <ViewValue value={draft.design_effectiveness} badgeClass={EFFECTIVENESS_STYLES[draft.design_effectiveness]} />
                )}
              </div>
              <div>
                <FieldLabel>
                  Operating Effectiveness {editing && <span className="text-destructive">*</span>} <InfoTooltip text={EFFECTIVENESS_HELP.operating} />
                </FieldLabel>
                {editing ? (
                  <ColoredSelect
                    value={draft.operating_effectiveness || 'Not Assessed'}
                    onChange={(v) => set({ operating_effectiveness: v })}
                    options={EFFECTIVENESS_OPTIONS}
                    styleFor={(o) => EFFECTIVENESS_STYLES[o] || ''}
                    className="bg-card dark:bg-background"
                  />
                ) : (
                  <ViewValue value={draft.operating_effectiveness} badgeClass={EFFECTIVENESS_STYLES[draft.operating_effectiveness]} />
                )}
              </div>
            </div>
          </SectionCard>

          {/* Notes */}
          <SectionCard>
            <FieldLabel>Control Notes</FieldLabel>
            {editing ? (
              <RichTextField
                value={draft.notes || ''}
                onChange={(v) => set({ notes: v })}
                placeholder="Add notes..."
                minHeight={120}
              />
            ) : draft.notes ? (
              <div
                className="text-sm text-foreground [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4"
                dangerouslySetInnerHTML={{ __html: sanitizeRiskHtml(draft.notes) }}
              />
            ) : (
              <p className="text-sm text-muted-foreground/50">—</p>
            )}
          </SectionCard>
        </div>

        {/* Footer */}
        {editing && (
          <div className="px-5 py-4 border-t border-border flex items-center justify-end gap-3 shrink-0">
            <EditFooterActions dirty={dirty} onCancel={cancelEdit} onSave={save}
              saving={saving} saveDisabled={titleMissing} saveLabel={isNew ? 'Add Control' : undefined} />
          </div>
        )}
      </div>
    </SlidePane>
  );
}