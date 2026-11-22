import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import SlidePane from '@/components/ui/SlidePane';
import { getSystemField, QUESTION_TYPES, questionTypeHasOptions, isLockedSystemField, getMappingIncompatibilityReason } from '@/lib/membershipForm';
import { getMappableMemberFields } from '@/lib/membershipApplication';
import PlanVisibilitySelector from './PlanVisibilitySelector';
import SectionCard from '@/components/shared/SectionCard';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
const NONE = '__none__';

// Same defaults the pane's working state uses, so an untouched pane is clean.
function questionSnapshot(field) {
  return {
    label: field?.label || '',
    type: field?.type || (field?.kind === 'custom' ? 'Text' : (getSystemField(field?.field_id)?.type || 'Text')),
    options: Array.isArray(field?.options) ? field.options : [],
    placeholder: field?.placeholder || '',
    mandatory: !!field?.mandatory,
    mapToField: field?.map_to_field || '',
    visibilityPlans: field?.visibility_plans || [],
  };
}

/**
 * Right-side slide-in pane for creating / editing a form question.
 * The question is only committed to the form layout when "Save" is pressed.
 */
export default function FieldSettingsPane({ isOpen, field, isNew = false, plans = [], customFields = [], takenMappings = [], onClose, onSave }) {
  const isCustom = field?.kind === 'custom';
  const isInline = isCustom && !customFields.some((cf) => cf.id === field.field_id);
  const locked = isLockedSystemField(field);

  const [label, setLabel] = useState(field?.label || '');
  const [type, setType] = useState(field?.type || (isCustom ? 'Text' : (getSystemField(field?.field_id)?.type || 'Text')));
  const [options, setOptions] = useState(Array.isArray(field?.options) ? field.options : []);
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [mandatory, setMandatory] = useState(!!field?.mandatory);
  const [mapToField, setMapToField] = useState(field?.map_to_field || '');
  const [visibilityPlans, setVisibilityPlans] = useState(field?.visibility_plans || []);

  const [baseline, setBaseline] = useState(() => questionSnapshot(field));
  useEffect(() => { if (field) setBaseline(questionSnapshot(field)); }, [field]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { label, type, options, placeholder, mandatory, mapToField, visibilityPlans },
    baseline, onClose, enabled: isOpen && !!field,
    select: (v) => ({ ...v, options: (v.options || []).filter((o) => (o || '').trim()) }),
  });

  // Escape goes through the guard like every other close path.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && requestClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Re-sync local state whenever a different field is opened in the pane.
  useEffect(() => {
    if (!field) return;
    setLabel(field.label || '');
    setType(field.type || (field.kind === 'custom' ? 'Text' : (getSystemField(field.field_id)?.type || 'Text')));
    setOptions(Array.isArray(field.options) ? field.options : []);
    setPlaceholder(field.placeholder || '');
    setMandatory(!!field.mandatory);
    setMapToField(field.map_to_field || '');
    setVisibilityPlans(field.visibility_plans || []);
  }, [field]);

  if (!field) return null;

  const fieldName = field.kind === 'system'
    ? (getSystemField(field.field_id)?.label || field.field_id)
    : (field.label || 'Question');

  const typeEditable = isInline;
  const showOptions = questionTypeHasOptions(type);
  const supportsMapping = isCustom;
  // Hide member fields already mapped to another question — one target per field.
  const taken = new Set(takenMappings.filter((id) => id && id !== field.map_to_field));
  const mappableFields = getMappableMemberFields(customFields).filter((mf) => !taken.has(mf.id));
  const selectedTarget = mapToField ? mappableFields.find((mf) => mf.id === mapToField) : null;
  const mappingError = supportsMapping ? getMappingIncompatibilityReason(type, selectedTarget) : null;

  const updateOption = (i, val) => setOptions((o) => o.map((x, idx) => (idx === i ? val : x)));
  const addOption = () => setOptions((o) => [...o, `Option ${o.length + 1}`]);
  const removeOption = (i) => setOptions((o) => o.filter((_, idx) => idx !== i));

  const handleSave = () => {
    if (mappingError) return;
    const next = {
      ...field,
      label: label.trim() || fieldName,
      placeholder: placeholder.trim(),
      mandatory,
      visibility_plans: visibilityPlans,
    };
    if (typeEditable) {
      next.type = type;
      next.options = questionTypeHasOptions(type)
        ? options.map((o) => (o || '').trim()).filter(Boolean)
        : [];
    }
    if (supportsMapping && mapToField) next.map_to_field = mapToField;
    else delete next.map_to_field;
    delete next.conditional_logic;
    onSave(next);
    onClose();
  };

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="h-full bg-card border-l border-border flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 shrink-0 border-b border-border">
          <h3 className="text-lg font-bold text-foreground">{isNew ? 'Add Question' : 'Field Settings'}</h3>
          <CloseButton onClick={requestClose} />
        </div>

        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
         <SectionCard className="space-y-4">
          {/* Question Type */}
          <div>
            <Label className="mb-1.5 block text-sm">Field Type <span className="text-destructive">*</span></Label>
            {typeEditable ? (
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-card"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QUESTION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input value={type} disabled className="bg-muted/60 text-muted-foreground" />
            )}
          </div>

          {/* Options */}
          {typeEditable && showOptions && (
            <div>
              <Label className="mb-1.5 block text-sm">Options</Label>
              <div className="space-y-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input value={opt} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} className="bg-card" />
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={addOption} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add Option
                </Button>
              </div>
            </div>
          )}

          {/* Question label */}
          <div>
            <Label className="mb-1.5 block text-sm">Question <span className="text-destructive">*</span></Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Type your question here" className="bg-card" />
          </div>

          {/* Placeholder */}
          <div>
            <Label className="mb-1.5 block text-sm">Add Placeholder <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} placeholder="Placeholder text shown inside the field" className="bg-card" />
          </div>

          {/* Required */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-sm font-medium text-foreground">Required field</p>
              <p className="text-[11px] text-muted-foreground">Mark this question as required to submit the application.</p>
            </div>
            <Switch checked={mandatory} onCheckedChange={setMandatory} disabled={locked} />
          </div>
         </SectionCard>

          {/* Locked system field — mapping is fixed to the member profile */}
          {locked && (
            <SectionCard>
              <Label className="mb-1.5 block text-sm">Map to Member profile field</Label>
              <Input value={fieldName} disabled className="bg-card text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground mt-1">This is a core member field. It's permanently mapped to the member profile and can't be changed.</p>
            </SectionCard>
          )}

          {/* Map to member field */}
          {supportsMapping && (
            <SectionCard>
              <Label className="mb-1.5 block text-sm">Map to Member profile field</Label>
              <Select value={mapToField || NONE} onValueChange={(v) => setMapToField(v === NONE ? '' : v)}>
                <SelectTrigger className="bg-card"><SelectValue placeholder="Don't map (response only)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Don't map (response only)</SelectItem>
                  {mappableFields.map((mf) => (
                    <SelectItem key={mf.id} value={mf.id}>{mf.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mappingError ? (
                <p className="text-[11px] text-destructive mt-1">{mappingError}</p>
              ) : (
                <p className="text-[11px] text-muted-foreground mt-1">Mapped answers are written to the member's profile on submission.</p>
              )}
            </SectionCard>
          )}

          {/* Plan visibility */}
          <SectionCard>
            <PlanVisibilitySelector plans={plans} selected={visibilityPlans} onChange={setVisibilityPlans} />
          </SectionCard>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 shrink-0 border-t border-border">
          <Button variant="outline" onClick={requestClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!mappingError}>{isNew ? 'Add Question' : 'Save Field'}</Button>
        </div>
      </div>
    </SlidePane>
    {dialog}
    </>
  );
}