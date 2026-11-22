import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { X, Plus, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { OPTION_COLORS } from '@/lib/registerColors';
import { COMPLIANCE_CUSTOM_FIELD_TYPES, complianceFieldHasOptions, newComplianceFieldId } from '@/lib/complianceApi';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const defaultOption = (idx = 0) => ({ name: '', color: OPTION_COLORS[idx % OPTION_COLORS.length].id });

function OptionRow({ opt, onChange, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const colorDef = OPTION_COLORS.find((c) => c.id === opt.color) || OPTION_COLORS[0];
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className={`w-7 h-7 rounded-full flex items-center justify-center ${colorDef.bg} border-2 border-white shadow-sm`}
        >
          <span className={`w-3 h-3 rounded-full ${colorDef.dot}`} />
        </button>
        {pickerOpen && (
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 bg-popover border border-border rounded-lg shadow-lg p-2 flex gap-1.5">
            {OPTION_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange({ ...opt, color: c.id }); setPickerOpen(false); }}
                className={`w-6 h-6 rounded-full ${c.bg} border-2 flex items-center justify-center hover:scale-110 transition-all ${opt.color === c.id ? 'border-gray-400' : 'border-transparent'}`}
              >
                <span className={`w-3 h-3 rounded-full ${c.dot}`} />
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        value={opt.name}
        onChange={(e) => onChange({ ...opt, name: e.target.value })}
        placeholder="Option name"
        className="flex-1 h-9 rounded-md border border-input bg-secondary/40 px-3 text-sm outline-none focus:ring-1 focus:ring-ring"
      />
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/**
 * Create / edit a USER custom field for the Compliance module.
 */
export default function AddComplianceFieldModal({ isOpen, onClose, field, onSave }) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState('Single Select');
  const [options, setOptions] = useState([defaultOption(0), defaultOption(1)]);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const snap = {
      label: field?.label || '',
      type: field?.type || 'Single Select',
      options: field?.config?.options?.length ? field.config.options.map((o) => ({ ...o })) : [defaultOption(0), defaultOption(1)],
    };
    setLabel(snap.label);
    setType(snap.type);
    setOptions(snap.options.map((o) => ({ ...o })));
    setBaseline(snap);
    setBusy(false);
  }, [isOpen, field]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { label, type, options }, baseline, onClose, saving: busy, enabled: isOpen && !!baseline,
    subject: 'field changes',
  });

  const showOptions = complianceFieldHasOptions(type);
  const isSystem = field?.system === true;

  const addOption = () => setOptions((prev) => [...prev, defaultOption(prev.length)]);
  const updateOption = (idx, val) => setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)));
  const removeOption = (idx) => setOptions((prev) => prev.filter((_, i) => i !== idx));

  const handleSave = guardSave(setBusy, async () => {
    if (!label.trim() || busy) return;
    const valid = options.filter((o) => o.name.trim());
    if (showOptions && valid.length === 0) return;
    setBusy(true);
    try {
      await onSave({
        ...(field || {}),
        id: field?.id || newComplianceFieldId(),
        label: label.trim(),
        type,
        system: field?.system === true,
        isVisible: field ? field.isVisible !== false : false,
        config: showOptions ? { options: valid.map((o) => ({ name: o.name.trim(), color: o.color })) } : {},
      });
      onClose();
    } finally {
      setBusy(false);
    }
  });

  return (
    <>
    <ModalOverlay isOpen={isOpen} onClose={requestClose} className="w-full max-w-lg">
      <div className="bg-card rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-lg font-bold text-foreground">{field ? 'Edit custom field' : 'Add custom field'}</h2>
          <CloseButton onClick={requestClose} />
        </div>

        <div className="px-6 pb-5 space-y-5">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Field name {!isSystem && <span className="text-destructive">*</span>}
              </Label>
              {isSystem ? (
                <div className="flex items-center gap-2 h-9 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed">
                  <span className="truncate flex-1">{label}</span>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                </div>
              ) : (
                <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Reference Legislation" autoFocus />
              )}
            </div>
            <div className="w-52">
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Field type</Label>
              {isSystem ? (
                <div className="flex items-center gap-2 h-9 rounded-md border border-input bg-muted/50 px-3 text-sm text-muted-foreground cursor-not-allowed">
                  <span className="truncate flex-1">{type}</span>
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                </div>
              ) : (
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(COMPLIANCE_CUSTOM_FIELD_TYPES.includes(type) ? COMPLIANCE_CUSTOM_FIELD_TYPES : [type, ...COMPLIANCE_CUSTOM_FIELD_TYPES]).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {showOptions && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-muted-foreground">
                Options <span className="text-destructive">*</span>
              </Label>
              {options.map((opt, idx) => (
                <OptionRow key={idx} opt={opt} onChange={(val) => updateOption(idx, val)} onRemove={() => removeOption(idx)} />
              ))}
              <button type="button" onClick={addOption} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mt-1">
                <Plus className="w-3.5 h-3.5" /> Add an option
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={requestClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!label.trim() || busy}>
            {busy ? 'Saving...' : (field ? 'Save Changes' : 'Create Field')}
          </Button>
        </div>
      </div>
    </ModalOverlay>
    {dialog}
    </>
  );
}