import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import SlidePane from '@/components/ui/SlidePane';
import FieldCard from '@/components/shared/customizer/FieldCard';
import ReadOnlyOptions from '@/components/shared/customizer/ReadOnlyOptions';
import { FieldEditProvider, useFieldCustomiser, useFieldEdit, cleanOptionFields } from '@/components/shared/customizer/fieldEditMode';
import { OPTION_COLORS } from '@/lib/registerColors';
import { MANAGED_FIELD_IDS } from '@/lib/riskApi';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { fieldOptionsSnapshot } from '@/lib/unsavedChanges/fieldOptionsSnapshot';
import useRemovalConfirm from '@/components/shared/customizer/useRemovalConfirm';

const snapshot = fieldOptionsSnapshot(MANAGED_FIELD_IDS);
const clone = (v) => JSON.parse(JSON.stringify(v || []));

// The colour picker's open state lives in the pane so the guard can treat it
// as a child step: dismissing it never reaches the pane's close path.
function OptionRow({ opt, onChange, onRemove, pickerOpen, setPickerOpen }) {
  const colorDef = OPTION_COLORS.find((c) => c.id === opt.color) || OPTION_COLORS[0];

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className={`w-6 h-6 rounded-full flex items-center justify-center ${colorDef.bg} border-2 border-white shadow-sm`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${colorDef.dot}`} />
        </button>
        {pickerOpen && (
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1.5">
            {OPTION_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange({ ...opt, color: c.id }); setPickerOpen(false); }}
                className={`w-5 h-5 rounded-full ${c.bg} border-2 flex items-center justify-center hover:scale-110 transition-all ${opt.color === c.id ? 'border-gray-400' : 'border-transparent'}`}
              >
                <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        value={opt.name}
        onChange={(e) => onChange({ ...opt, name: e.target.value })}
        placeholder="Option name"
        className="flex-1 h-8 rounded-md border border-input bg-secondary/40 px-2 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function FieldEditor({ field, savedField, onUpdate, pickerKey, setPickerKey }) {
  const { editing } = useFieldEdit(field.id);
  const { confirm, dialog } = useRemovalConfirm();
  const opts = field.config?.options || [];
  const savedNames = new Set((savedField?.config?.options || []).map((o) => o.name));

  const updateOption = (idx, val) =>
    onUpdate({ ...field, config: { ...field.config, options: opts.map((o, i) => (i === idx ? val : o)) } });
  const addOption = () =>
    onUpdate({
      ...field,
      config: { ...field.config, options: [...opts, { name: '', color: OPTION_COLORS[opts.length % OPTION_COLORS.length].id }] },
    });
  const removeOption = (idx) => {
    const next = { ...field, config: { ...field.config, options: opts.filter((_, i) => i !== idx) } };
    if (opts[idx].name && savedNames.has(opts[idx].name)) confirm('option', opts[idx].name, () => onUpdate(next));
    else onUpdate(next);
  };

  return (
    <>
      <FieldCard id={field.id} title={field.label} locked>
        {!editing ? <ReadOnlyOptions options={opts} colored /> : (
        <>
          {opts.map((opt, idx) => (
            <OptionRow
              key={idx} opt={opt} onChange={(v) => updateOption(idx, v)} onRemove={() => removeOption(idx)}
              pickerOpen={pickerKey === `${field.id}:${idx}`}
              setPickerOpen={(next) => {
                const key = `${field.id}:${idx}`;
                const open = typeof next === 'function' ? next(pickerKey === key) : next;
                setPickerKey(open ? key : null);
              }}
            />
          ))}
          <button onClick={addOption} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mt-1">
            <Plus className="w-3 h-3" /> Add option
          </button>
        </>
        )}
      </FieldCard>
      {dialog}
    </>
  );
}

/** Risk customiser — Risk Category options only; all other risk fields are fixed. Each field saves on its own. */
export default function RiskFieldConfigPane({ fields, onClose, onSave }) {
  const [pickerKey, setPickerKey] = useState(null);
  const fc = useFieldCustomiser({
    load: () => clone(fields),
    normalize: cleanOptionFields,
    persist: (next) => onSave(next),
  });

  const { requestClose, dialog } = useUnsavedChanges({
    draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, select: snapshot,
    childOpen: !!pickerKey, closeChild: () => setPickerKey(null),
    subject: 'field configuration changes',
  });

  const handleUpdate = (updated) => fc.setDraft((d) => d.map((f) => (f.id === updated.id ? updated : f)));
  const managedFields = MANAGED_FIELD_IDS.map((id) => fc.draft.find((f) => f.id === id)).filter(Boolean);

  return (
    <>
    <SlidePane isOpen onClose={requestClose}>
      <FieldEditProvider value={fc.value}>
      <div
        className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <CustomisePaneTitle subtitle="Manage Category field options" />
          <CloseButton onClick={requestClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Fields</p>
            <p className="text-xs text-muted-foreground/60 mb-2.5">System fields (🔒) cannot be deleted. You can customise their options.</p>
            <div className="space-y-2">
              {managedFields.map((field) => (
                <FieldEditor key={field.id} field={field} savedField={fc.saved.find((f) => f.id === field.id)} onUpdate={handleUpdate} pickerKey={pickerKey} setPickerKey={setPickerKey} />
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