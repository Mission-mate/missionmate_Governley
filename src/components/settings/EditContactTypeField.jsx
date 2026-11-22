import CloseButton from '@/components/shared/CloseButton';
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SlidePane from '@/components/ui/SlidePane';
import { useToast } from '@/components/ui/use-toast';
import {
  CONTACT_TYPE_FIELD_NAME, CONTACT_TYPE_SECTION, CONTACT_TYPE_FIELD_TYPES,
  saveContactTypeConfig,
} from '@/lib/contactTypeConfig';
function LockedInput({ value }) {
  return (
    <div className="relative">
      <Input value={value} disabled className="bg-muted/60 text-muted-foreground cursor-not-allowed pr-9" />
      <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
    </div>
  );
}

import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const optionsSnapshot = (opts) => (opts || []).filter((o) => (o.label || '').trim()).map((o) => ({ label: o.label, color: o.color }));

const slugify = (s) => s.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

export default function EditContactTypeField({ isOpen, onClose, config, record, onSaved }) {
  const { toast } = useToast();
  const [fieldType, setFieldType] = useState(config.fieldType);
  const [description, setDescription] = useState(config.description || '');
  const [options, setOptions] = useState(config.options || []);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFieldType(config.fieldType);
      setDescription(config.description || '');
      setOptions(config.options || []);
    }
  }, [isOpen, config]);

  const [baseline, setBaseline] = useState(config.options || []);
  useEffect(() => { if (isOpen) setBaseline(config.options || []); }, [isOpen, config]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: options, baseline, onClose, saving, enabled: isOpen, select: optionsSnapshot,
  });

  const addOption = () => setOptions((o) => [...o, { label: '', value: '' }]);
  const removeOption = (idx) => setOptions((o) => o.filter((_, i) => i !== idx));
  const updateOption = (idx, label) =>
    setOptions((o) => o.map((opt, i) => (i === idx ? { label, value: slugify(label) } : opt)));

  const handleSave = async () => {
    const cleaned = options.filter((o) => o.label.trim());
    if (cleaned.length === 0) {
      toast({ title: 'Add at least one option', variant: 'destructive' });
      return;
    }
    try {
      setSaving(true);
      const next = { fieldType, description, required: true, options: cleaned };
      await saveContactTypeConfig(next, record);
      await onSaved();
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to save field.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = fieldType === 'Dropdown (Multi-Select)' ? 'multi select' : 'single select';

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="h-full bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Edit custom field</h2>
            <p className="text-sm text-muted-foreground">Customize your field's details and see live preview</p>
          </div>
          <CloseButton onClick={requestClose} />
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Field details */}
          <div className="border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-4">Field details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <Label className="mb-1.5 block text-sm">Field type <span className="text-red-500">*</span></Label>
                <LockedInput value={fieldType} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Add to object <span className="text-red-500">*</span></Label>
                <LockedInput value="Contacts" />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Field name <span className="text-red-500">*</span></Label>
                <LockedInput value={CONTACT_TYPE_FIELD_NAME} />
              </div>
              <div>
                <Label className="mb-1.5 flex items-center gap-1.5 text-sm">
                  Section
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="z-[110]">
                        <p className="max-w-[220px]">Custom Fields will appear in the Additional Details section</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </Label>
                <LockedInput value="Additional Details" />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Define dropdown ({typeLabel}) options</h3>
                <p className="text-sm text-muted-foreground">Let users select values from a predefined list</p>
              </div>
            </div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">Dropdown options <span className="text-red-500">*</span></p>
              <button onClick={addOption} className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
                <Plus className="w-4 h-4" /> Add option
              </button>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="flex items-center px-3 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
                <span className="flex-1 flex items-center gap-1">Dropdown label <Info className="w-3 h-3" /></span>
                <span className="flex-1 flex items-center gap-1">Value <Info className="w-3 h-3" /></span>
                <span className="w-12 text-right">Action</span>
              </div>
              {options.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground text-center">No options yet. Click "Add option".</p>
              ) : (
                options.map((opt, idx) => (
                  <div key={idx} className="flex items-center px-3 py-2 gap-2 border-b border-border last:border-0">
                    <Input
                      value={opt.label}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder="Label"
                      className="flex-1 h-8 text-sm"
                    />
                    <span className="flex-1 text-sm text-muted-foreground truncate px-2">{opt.value || '—'}</span>
                    <button onClick={() => removeOption(idx)} className="w-12 flex justify-end text-red-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={requestClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </div>
    </SlidePane>
    {dialog}
    </>
  );
}