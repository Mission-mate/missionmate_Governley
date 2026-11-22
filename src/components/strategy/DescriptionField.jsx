import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

/**
 * Optional description field for Add/Edit level modals.
 * Renders a clickable "+ Add Description" link until there is content or the
 * user opens it; then shows the textarea.
 */
export default function DescriptionField({ value, onChange }) {
  const [open, setOpen] = useState(!!value);

  useEffect(() => { if (value) setOpen(true); }, [value]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Description
      </button>
    );
  }

  return (
    <div>
      <label className="text-sm font-medium text-foreground block mb-1.5">Description</label>
      <Textarea value={value || ''} onChange={(e) => onChange(e.target.value)} rows={3} placeholder="Brief description..." autoFocus />
    </div>
  );
}