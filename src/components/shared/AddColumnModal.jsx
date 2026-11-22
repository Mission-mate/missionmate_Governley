import React, { useState, useEffect } from 'react';
import { Plus, X, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { COLUMN_TYPES } from '@/lib/registerColumnTypes';
import { OPTION_COLORS } from '@/lib/registerColors';
import CloseButton from '@/components/shared/CloseButton';
import ColumnTypeSelect from '@/components/shared/ColumnTypeSelect';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

export const CHECKBOX_STYLES = [
  { id: 'checkbox', label: 'Checkbox', preview: '☑' },
  { id: 'flag',     label: 'Flag',     preview: '🚩' },
  { id: 'star',     label: 'Star',     preview: '⭐' },
];

export const SYMBOL_STYLES = [
  { id: 'traffic_light', label: 'Traffic Light', symbols: ['🔴','🟠','🟢','🔵'] },
  { id: 'status_icons',  label: 'Status Icons',  symbols: ['✅','ℹ️','❌'] },
  { id: 'arrows',        label: 'Arrows',        symbols: ['↓','↘','↗','↑'] },
  { id: 'stars',         label: 'Stars',         symbols: ['⭐','⭐⭐','⭐⭐⭐','⭐⭐⭐⭐','⭐⭐⭐⭐⭐'] },
  { id: 'faces',         label: 'Faces',         symbols: ['😊','🙂','😐','🙁','😞'] },
];

const TYPE_PLACEHOLDERS = {
  'Single Select':  'Priority, Stage, Status...',
  'Multi Select':   'Priority, Stage, Status...',
  'Date':           'e.g. Due Date, Start Date, End Date',
  'People':         'e.g. Responsible, Project Lead, Owner',
  'Text/Number':    'e.g. Name, Title, Cost, Amount',
  'Progress':       'e.g. Completion Rate, Success Rate',
  'Checkbox':       'e.g. Checkbox',
  'Symbols':        'e.g. Trend, Traffic Light, Reviews',
  'Long Text':      'e.g. Notes, Comments, Background',
};

const NEEDS_OPTIONS = ['Single Select', 'Multi Select'];

const defaultOption = (idx = 0) => ({ name: '', color: OPTION_COLORS[idx % OPTION_COLORS.length].id });

const EMPTY_DRAFT = {
  title: '', type: 'Single Select', options: [defaultOption(0), defaultOption(1)],
  checkboxStyle: 'checkbox', symbolStyle: 'traffic_light',
};

export function OptionRow({ opt, onChange, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const colorDef = OPTION_COLORS.find(c => c.id === opt.color) || OPTION_COLORS[0];

  return (
    <div className="flex items-center gap-2">
      {/* Color picker trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen(o => !o)}
          className={`w-7 h-7 rounded-full flex items-center justify-center ${colorDef.bg} border-2 border-white shadow-sm hover:scale-105 transition-transform`}
        >
          <span className={`w-3 h-3 rounded-full ${colorDef.dot}`} />
        </button>
        {pickerOpen && (
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 bg-white border border-border rounded-lg shadow-lg p-2 flex gap-1.5">
            {OPTION_COLORS.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => { onChange({ ...opt, color: c.id }); setPickerOpen(false); }}
                className={`w-6 h-6 rounded-full ${c.bg} border-2 flex items-center justify-center transition-all hover:scale-110 ${opt.color === c.id ? 'border-gray-400 scale-110' : 'border-transparent'}`}
              >
                <span className={`w-3 h-3 rounded-full ${c.dot}`} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Option name input */}
      <input
        value={opt.name}
        onChange={(e) => onChange({ ...opt, name: e.target.value })}
        placeholder="Type an option name"
        className="flex-1 h-9 rounded-md border border-input bg-secondary/40 px-3 text-sm outline-none focus:ring-1 focus:ring-ring focus:border-ring"
      />

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Shared "Add column" modal used by the Strategy task and reporting tables. */
export default function AddColumnModal({ isOpen, onClose, onCreate, overlayClassName, types = COLUMN_TYPES }) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('Single Select');
  const [options, setOptions] = useState([defaultOption(0), defaultOption(1)]);
  const [checkboxStyle, setCheckboxStyle] = useState('checkbox');
  const [symbolStyle, setSymbolStyle] = useState('traffic_light');
  const [checkboxOpen, setCheckboxOpen] = useState(false);
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTitle(''); setType('Single Select');
      setOptions([defaultOption(0), defaultOption(1)]);
      setCheckboxStyle('checkbox'); setSymbolStyle('traffic_light');
      setCheckboxOpen(false); setSymbolOpen(false);
      setBusy(false);
    }
  }, [isOpen]);

  // Reset options when switching to/from select types
  useEffect(() => {
    if (NEEDS_OPTIONS.includes(type) && options.length === 0) {
      setOptions([defaultOption(0), defaultOption(1)]);
    }
  }, [type]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title, type, options, checkboxStyle, symbolStyle },
    baseline: EMPTY_DRAFT, onClose, saving: busy, enabled: isOpen,
    subject: 'column changes',
  });

  const addOption = () => setOptions(prev => [...prev, defaultOption(prev.length)]);
  const updateOption = (idx, val) => setOptions(prev => prev.map((o, i) => i === idx ? val : o));
  const removeOption = (idx) => setOptions(prev => prev.filter((_, i) => i !== idx));

  const handleCreate = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      const validOptions = options.filter(o => o.name.trim());
      let config = {};
      if (NEEDS_OPTIONS.includes(type)) {
        config = { options: validOptions.map(o => ({ name: o.name.trim(), color: o.color })) };
      } else if (type === 'Checkbox') {
        config = { style: checkboxStyle };
      } else if (type === 'Symbols') {
        config = { style: symbolStyle };
      }
      await onCreate({ title: title.trim(), type, config });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <ModalOverlay isOpen={isOpen} onClose={requestClose} className="w-full max-w-lg" overlayClassName={overlayClassName}>
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-lg font-bold text-foreground">Add column</h2>
          <CloseButton onClick={requestClose} />
        </div>

        <div className="px-6 pb-5 space-y-5">
          {/* Title + Type row */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                Column title <span className="text-destructive">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={TYPE_PLACEHOLDERS[type] || 'Column name...'}
                autoFocus
              />
            </div>
            <div className="w-44">
              <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">Column type</Label>
              <ColumnTypeSelect value={type} onChange={setType} types={types} />
            </div>
          </div>

          {/* Options section */}
          {NEEDS_OPTIONS.includes(type) && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-muted-foreground">
                Options <span className="text-destructive">*</span>
              </Label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <OptionRow
                    key={idx}
                    opt={opt}
                    onChange={(val) => updateOption(idx, val)}
                    onRemove={() => removeOption(idx)}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add an option
              </button>
            </div>
          )}

          {/* Checkbox style */}
          {type === 'Checkbox' && (() => {
            const selected = CHECKBOX_STYLES.find(s => s.id === checkboxStyle) || CHECKBOX_STYLES[0];
            return (
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-muted-foreground">Checkbox style</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setCheckboxOpen(o => !o)}
                    className="h-9 w-full rounded-md border border-input bg-secondary/40 px-3 text-sm flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <span>{selected.preview}</span>
                      <span>{selected.label}</span>
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {checkboxOpen && (
                    <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 w-full bg-white border border-border rounded-lg shadow-lg py-1">
                      {CHECKBOX_STYLES.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setCheckboxStyle(s.id); setCheckboxOpen(false); }}
                          className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted/50"
                        >
                          <span className="w-5">{s.preview}</span>
                          <span>{s.label}</span>
                          {checkboxStyle === s.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Symbol style */}
          {type === 'Symbols' && (() => {
            const selected = SYMBOL_STYLES.find(s => s.id === symbolStyle) || SYMBOL_STYLES[0];
            return (
              <div className="space-y-1.5">
                <Label className="block text-xs font-medium text-muted-foreground">Symbol style</Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setSymbolOpen(o => !o)}
                    className="h-9 w-full rounded-md border border-input bg-secondary/40 px-3 text-sm flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1.5">
                      {selected.symbols.map((sym, i) => <span key={i}>{sym}</span>)}
                    </span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  {symbolOpen && (
                    <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 w-full bg-white border border-border rounded-lg shadow-lg py-1">
                      {SYMBOL_STYLES.map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSymbolStyle(s.id); setSymbolOpen(false); }}
                          className="w-full px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted/50"
                        >
                          <span className="flex items-center gap-1">
                            {s.symbols.map((sym, i) => <span key={i}>{sym}</span>)}
                          </span>
                          {symbolStyle === s.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={requestClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title.trim() || busy}>
            {busy ? 'Creating...' : 'Create column'}
          </Button>
        </div>
      </div>
    </ModalOverlay>
    {dialog}
    </>
  );
}