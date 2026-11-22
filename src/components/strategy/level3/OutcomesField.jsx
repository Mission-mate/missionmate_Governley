import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import OutcomesEditor from './OutcomesEditor';

/**
 * Optional outcomes field for the Add/Edit Level 3 modal.
 * Shows a "+ Add Outcomes" link until opened or outcomes exist.
 */
export default function OutcomesField({ outcomes = [], onChange }) {
  const [open, setOpen] = useState(outcomes.length > 0);

  useEffect(() => { if (outcomes.length > 0) setOpen(true); }, [outcomes.length]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <Plus className="w-4 h-4" /> Add Outcomes (What success looks like)
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-foreground">Outcomes (What success looks like)</label>
        {outcomes.length === 0 && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Remove
          </button>
        )}
      </div>
      <OutcomesEditor outcomes={outcomes} onChange={onChange} />
    </div>
  );
}