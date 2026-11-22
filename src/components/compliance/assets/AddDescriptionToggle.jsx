import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';

/** "+ Add Description" link that reveals an auto-growing description box. */
export default function AddDescriptionToggle({ value, onChange, label = 'Description', placeholder = 'Describe the asset...', className = 'sm:col-span-2' }) {
  const [open, setOpen] = useState(!!value);
  // Values loaded after mount (e.g. an edit form hydrating) reveal the field.
  useEffect(() => { if (value) setOpen(true); }, [value]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${className} inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors w-fit`}
      >
        <Plus className="w-4 h-4" /> Add {label}
      </button>
    );
  }

  return (
    <div className={`${className} min-w-0`}>
      <label className="text-xs font-semibold text-muted-foreground block mb-1.5">{label}</label>
      <AutoGrowTextarea
        autoFocus={!value}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-h-[72px] bg-card"
      />
    </div>
  );
}