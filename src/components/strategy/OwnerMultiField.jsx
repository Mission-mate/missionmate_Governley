import React from 'react';
import { X, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import OwnerLabelHint from './OwnerLabelHint';

export const PANE_OWNER_LABEL_CLASS = 'text-[11px] font-semibold text-muted-foreground uppercase tracking-wide';
export const MODAL_OWNER_LABEL_CLASS = 'text-sm font-medium text-foreground';

/**
 * Owner field with inline co-owner expansion.
 * The label row carries the 'Add co-owner' link, right-aligned above the inputs.
 * Row 0 is the primary owner (drives grouping / filtering); rows 1+ are removable co-owners.
 */
export default function OwnerMultiField({
  value = [],
  onChange,
  placeholder = 'Assign an owner',
  label = 'Owner',
  labelClassName = PANE_OWNER_LABEL_CLASS,
  inputClassName = 'h-9'
}) {
  const rows = value && value.length > 0 ? value : [''];

  const setAt = (i, v) => onChange(rows.map((r, idx) => idx === i ? v : r));
  const removeAt = (i) => onChange(rows.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={cn('flex items-center gap-1.5', labelClassName)}>
          {label} <OwnerLabelHint />
        </span>
        <button
          type="button"
          onClick={() => onChange([...rows, ''])}
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-primary/80 transition-colors text-[hsl(var(--muted-foreground))]">
          
          <Plus className="w-3.5 h-3.5" /> Add co-owner
        </button>
      </div>
      {rows.map((row, i) =>
      <div key={i} className="relative">
          <Input
          value={row}
          onChange={(e) => setAt(i, e.target.value)}
          placeholder={i === 0 ? placeholder : 'Co-owner'}
          className={cn('bg-card', inputClassName, i > 0 && 'pr-8')} />
        
          {i > 0 &&
        <button
          type="button"
          onClick={() => removeAt(i)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-destructive transition-colors"
          title="Remove owner">
          
              <X className="w-3.5 h-3.5" />
            </button>
        }
        </div>
      )}
    </div>);

}