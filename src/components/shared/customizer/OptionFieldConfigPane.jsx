import React from 'react';
import { X, Plus } from 'lucide-react';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { fieldOptionsSnapshot } from '@/lib/unsavedChanges/fieldOptionsSnapshot';
import useRemovalConfirm from './useRemovalConfirm';
import FieldCard from './FieldCard';
import ReadOnlyOptions from './ReadOnlyOptions';
import { FieldEditProvider, useFieldCustomiser, useFieldEdit, cleanOptionFields } from './fieldEditMode';

const clone = (v) => JSON.parse(JSON.stringify(v || []));

function FieldEditor({ field, savedField, onUpdate }) {
  const { editing } = useFieldEdit(field.id);
  const { confirm, dialog } = useRemovalConfirm();
  const opts = field.config?.options || [];
  const savedNames = new Set((savedField?.config?.options || []).map((o) => o.name));
  const setOptions = (options) => onUpdate({ ...field, config: { ...field.config, options } });

  const removeOption = (idx) => {
    const next = opts.filter((_, i) => i !== idx);
    if (opts[idx].name && savedNames.has(opts[idx].name)) confirm('option', opts[idx].name, () => setOptions(next));
    else setOptions(next);
  };

  return (
    <>
      <FieldCard id={field.id} title={field.label} locked>
        {editing ? (
          <>
            {opts.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  value={opt.name}
                  onChange={(e) => setOptions(opts.map((o, i) => (i === idx ? { ...opt, name: e.target.value } : o)))}
                  placeholder="Option name"
                  className="flex-1 h-8 rounded-md border border-input bg-secondary/40 px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
                />
                <button type="button" onClick={() => removeOption(idx)} className="text-muted-foreground hover:text-destructive shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            <button onClick={() => setOptions([...opts, { name: '' }])} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1">
              <Plus className="w-3 h-3" /> Add option
            </button>
          </>
        ) : (
          <ReadOnlyOptions options={opts} />
        )}
      </FieldCard>
      {dialog}
    </>
  );
}

/** Customise pane for system fields whose only editable part is their option list (Work Plan, Compliance). Each field saves on its own. */
export default function OptionFieldConfigPane({ fields, managedIds, subtitle, onClose, onSave }) {
  const fc = useFieldCustomiser({
    load: () => clone(fields),
    normalize: cleanOptionFields,
    persist: (next) => onSave(next),
  });

  const { requestClose, dialog } = useUnsavedChanges({
    draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, select: fieldOptionsSnapshot(managedIds),
    subject: 'field configuration changes',
  });

  const handleUpdate = (updated) => fc.setDraft((d) => d.map((f) => (f.id === updated.id ? updated : f)));
  const managedFields = managedIds.map((id) => fc.draft.find((f) => f.id === id)).filter(Boolean);

  return (
    <>
    <SlidePane isOpen onClose={requestClose}>
      <FieldEditProvider value={fc.value}>
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <CustomisePaneTitle subtitle={subtitle} />
          <CloseButton onClick={requestClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Fields</p>
            <p className="text-xs text-muted-foreground/60 mb-2.5">System fields (🔒) cannot be deleted. You can customise options.</p>
            <div className="space-y-2">
              {managedFields.map((field) => (
                <FieldEditor key={field.id} field={field} savedField={fc.saved.find((f) => f.id === field.id)} onUpdate={handleUpdate} />
              ))}
            </div>
          </div>
        </div>
      </div>
      </FieldEditProvider>
    </SlidePane>
    {dialog}
    </>
  );
}