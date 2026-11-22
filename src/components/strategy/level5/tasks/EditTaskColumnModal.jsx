import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { OPTION_COLORS } from '@/lib/registerColors';
import CloseButton from '@/components/shared/CloseButton';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';

function OptionEditor({ opt, onChange, onRemove }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const colorDef = OPTION_COLORS.find((c) => c.id === opt.color) || OPTION_COLORS[0];
  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((o) => !o)}
          className={`w-7 h-7 rounded-full flex items-center justify-center ${colorDef.bg} border-2 border-white shadow-sm hover:scale-105 transition-transform`}
        >
          <span className={`w-3 h-3 rounded-full ${colorDef.dot}`} />
        </button>
        {pickerOpen && (
          <div className="animate-dropdown-enter absolute top-full mt-1 left-0 z-50 bg-white border border-border rounded-lg shadow-lg p-2 flex gap-1.5">
            {OPTION_COLORS.map((c) => (
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
      <input
        value={opt.name}
        onChange={(e) => onChange({ ...opt, name: e.target.value })}
        placeholder="Type an option name"
        className="flex-1 h-9 rounded-md border border-input bg-secondary/40 px-3 text-sm outline-none focus:ring-1 focus:ring-ring focus:border-ring"
      />
      <button type="button" onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Centre modal to edit a task column's title and (for select types) its options. Columns cannot be deleted here. */
export default function EditTaskColumnModal({ isOpen, column, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState([]);
  const [busy, setBusy] = useState(false);
  const [baseline, setBaseline] = useState({ title: '', options: [] });

  const isSelect = column && (column.type === 'Single Select' || column.type === 'Multi Select');

  useEffect(() => {
    if (isOpen && column) {
      const t = column.label || column.title || '';
      const src = column.kind === 'builtin' ? column.options : column.config?.options;
      const opts = (src || []).map((o) => ({ ...o }));
      setTitle(t);
      setOptions(opts);
      setBaseline({ title: t, options: opts.map((o) => ({ ...o })) });
      setBusy(false);
    }
  }, [isOpen, column]);

  const { requestClose, dialog } = useUnsavedChanges({
    draft: { title, options }, baseline, onClose, saving: busy, enabled: isOpen && !!column,
    subject: 'column changes',
  });

  if (!column) return null;

  const save = async () => {
    if (!title.trim() || busy) return;
    setBusy(true);
    try {
      await onSave({
        title: title.trim(),
        options: isSelect ? options.filter((o) => o.name.trim()).map((o) => ({ name: o.name.trim(), color: o.color })) : null,
      });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
    <ModalOverlay isOpen={isOpen} onClose={requestClose} className="w-full max-w-lg" overlayClassName="z-[130]">
      <div className="bg-white dark:bg-card rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 pt-5 pb-4">
          <h2 className="text-lg font-bold text-foreground">Edit column</h2>
          <CloseButton onClick={requestClose} />
        </div>

        <div className="px-6 pb-5 space-y-5">
          <div>
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              Column title <span className="text-destructive">*</span>
            </Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          {isSelect && (
            <div className="space-y-2">
              <Label className="block text-xs font-medium text-muted-foreground">Options</Label>
              <div className="space-y-2">
                {options.map((opt, idx) => (
                  <OptionEditor
                    key={idx}
                    opt={opt}
                    onChange={(val) => setOptions((prev) => prev.map((o, i) => (i === idx ? val : o)))}
                    onRemove={() => setOptions((prev) => prev.filter((_, i) => i !== idx))}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOptions((prev) => [...prev, { name: '', color: OPTION_COLORS[prev.length % OPTION_COLORS.length].id }])}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add an option
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={requestClose}>Cancel</Button>
          <Button onClick={save} disabled={!title.trim() || busy}>{busy ? 'Saving...' : 'Save'}</Button>
        </div>
      </div>
    </ModalOverlay>
    {dialog}
    </>
  );
}