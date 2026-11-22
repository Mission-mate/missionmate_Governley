import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Info, Lock, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import SlidePane from '@/components/ui/SlidePane';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  FIELD_TYPES, fieldHasOptions, slugify,
  getObjectLabel, LOCKED_SECTION_LABEL, getFieldNamePlaceholder,
} from '@/lib/customFields';
import { CustomFieldEdit } from '@/components/contacts/CustomFieldRenderer';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

const labelOptions = (opts) => (opts || []).filter((o) => (o.label || '').trim()).map((o) => o.label);
const fieldSnapshot = (v) => ({ name: v.name, type: v.type, options: labelOptions(v.options) });
const baselineOf = (field) => ({ name: field?.name || '', type: field?.type || 'Text', options: field?.options || [] });
function LockedInput({ value }) {
  return (
    <div className="relative">
      <Input value={value} disabled className="bg-muted/60 text-muted-foreground cursor-not-allowed pr-9" />
      <Lock className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2" />
    </div>
  );
}

export default function CustomFieldEditor({ isOpen, onClose, field, onSave, objectId = 'contacts' }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [type, setType] = useState('Text');
  const [options, setOptions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(field?.name || '');
      setType(field?.type || 'Text');
      setOptions(field?.options || []);
    }
  }, [isOpen, field]);

  const [baseline, setBaseline] = useState(() => baselineOf(field));
  useEffect(() => { if (isOpen) setBaseline(baselineOf(field)); }, [isOpen, field]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { name, type, options }, baseline, onClose, saving, enabled: isOpen,
    select: fieldSnapshot,
  });

  const showOptions = fieldHasOptions(type);

  const addOption = () => setOptions((o) => [...o, { label: '', value: '' }]);
  const removeOption = (idx) => setOptions((o) => o.filter((_, i) => i !== idx));
  const updateOption = (idx, label) =>
    setOptions((o) => o.map((opt, i) => (i === idx ? { label, value: slugify(label) } : opt)));

  const onDragEnd = (result) => {
    if (!result.destination) return;
    setOptions((prev) => {
      const next = Array.from(prev);
      const [moved] = next.splice(result.source.index, 1);
      next.splice(result.destination.index, 0, moved);
      return next;
    });
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: 'Field name is required', variant: 'destructive' });
      return;
    }
    let cleaned = [];
    if (showOptions) {
      cleaned = options.filter((o) => o.label.trim());
      if (cleaned.length === 0) {
        toast({ title: 'Add at least one option', variant: 'destructive' });
        return;
      }
    }
    try {
      setSaving(true);
      await onSave({
        id: field?.id || crypto.randomUUID(),
        name: name.trim(),
        type,
        options: showOptions ? cleaned : [],
      });
      onClose();
    } catch {
      toast({ title: 'Error', description: 'Failed to save field.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const optionLabel = type === 'Radio Button' ? 'radio' : type === 'Checkbox' ? 'checkbox' : 'dropdown';
  const previewField = { name, type, options: options.filter((o) => o.label.trim()) };

  return (
    <>
    <SlidePane isOpen={isOpen} onClose={requestClose}>
      <div className="h-full bg-background flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{field ? 'Edit custom field' : 'Create custom field'}</h2>
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
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Add to module <span className="text-red-500">*</span></Label>
                <LockedInput value={getObjectLabel(objectId)} />
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Field name <span className="text-red-500">*</span></Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={getFieldNamePlaceholder(type)} />
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
                <LockedInput value={LOCKED_SECTION_LABEL} />
              </div>
            </div>
          </div>

          {/* Set default value / options */}
          <div className="border border-border rounded-xl p-5">
            <h3 className="text-base font-bold text-foreground mb-1">
              {showOptions ? `Define ${optionLabel} options` : 'Set default value'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {showOptions
                ? 'Let users select values from a predefined list. Drag to reorder.'
                : 'Preview of how this field appears inside a contact.'}
            </p>

            {showOptions ? (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-foreground">Options <span className="text-red-500">*</span></p>
                  <button onClick={addOption} className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
                    <Plus className="w-4 h-4" /> Add option
                  </button>
                </div>
                <DragDropContext onDragEnd={onDragEnd}>
                  <Droppable droppableId="options">
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className="border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center px-3 py-2 bg-muted/40 border-b border-border text-xs font-semibold text-muted-foreground">
                          <span className="w-6" />
                          <span className="flex-1 flex items-center gap-1">Label <Info className="w-3 h-3" /></span>
                          <span className="flex-1 flex items-center gap-1">Value <Info className="w-3 h-3" /></span>
                          <span className="w-10 text-right">Action</span>
                        </div>
                        {options.length === 0 ? (
                          <p className="px-3 py-4 text-sm text-muted-foreground text-center">No options yet. Click "Add option".</p>
                        ) : (
                          options.map((opt, idx) => (
                            <Draggable key={idx} draggableId={`opt-${idx}`} index={idx}>
                              {(prov) => (
                                <div ref={prov.innerRef} {...prov.draggableProps}
                                  className="flex items-center px-3 py-2 gap-2 border-b border-border last:border-0 bg-background">
                                  <span {...prov.dragHandleProps} className="w-6 flex justify-center text-muted-foreground/50 cursor-grab">
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                  <Input
                                    value={opt.label}
                                    onChange={(e) => updateOption(idx, e.target.value)}
                                    placeholder="Label"
                                    className="flex-1 h-8 text-sm"
                                  />
                                  <span className="flex-1 text-sm text-muted-foreground truncate px-2">{opt.value || '—'}</span>
                                  <button onClick={() => removeOption(idx)} className="w-10 flex justify-end text-red-400 hover:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </>
            ) : (
              <div className="max-w-xs pointer-events-none opacity-90">
                <CustomFieldEdit field={previewField} value={undefined} onChange={() => {}} />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={requestClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (field ? 'Save Changes' : 'Create Field')}</Button>
        </div>
      </div>
    </SlidePane>
    {dialog}
    </>
  );
}