import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';

const ROW = 'w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-foreground hover:bg-primary/10 transition-colors text-left';

/**
 * Reusable sort button + dropdown, styled to match the app's Group/Filter/Sort controls.
 * Uses the same outside-click menu as Group and Filter, so opening any of them
 * closes whichever toolbar menu was open before.
 *
 * Props:
 *  - fields: [{ key, label }]
 *  - value: { key, direction } | null
 *  - onChange: ({ key, direction }) => void
 */
export default function SortButton({ fields = [], value, onChange }) {
  const [open, setOpen] = useState(false);
  const isActive = (key, direction) => value?.key === key && value?.direction === direction;

  return (
    <div className="relative">
      <ToolbarButton icon={ArrowUpDown} label="Sort" active={!!value} onClick={() => setOpen((o) => !o)} />
      {open && (
        <ToolbarMenu onClose={() => setOpen(false)} className="w-52 px-2 py-2">
          <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide px-2 py-1.5">Sort By</div>
          {fields.map((field) => (
            <div key={field.key} className="mt-1">
              <p className="px-2 py-1 text-sm font-semibold text-foreground">{field.label}</p>
              <button
                onClick={() => onChange({ key: field.key, direction: 'asc' })}
                className={cn(ROW, isActive(field.key, 'asc') && 'bg-accent font-medium')}
              >
                <ArrowUp className="w-4 h-4 text-muted-foreground" /> Oldest to Newest
              </button>
              <button
                onClick={() => onChange({ key: field.key, direction: 'desc' })}
                className={cn(ROW, isActive(field.key, 'desc') && 'bg-accent font-medium')}
              >
                <ArrowDown className="w-4 h-4 text-muted-foreground" /> Newest to Oldest
              </button>
            </div>
          ))}
          {value && (
            <>
              <div className="border-t border-border mt-2 pt-1" />
              <button onClick={() => onChange(null)} className={cn(ROW, 'text-destructive')}>
                <X className="w-4 h-4" /> Clear Sort
              </button>
            </>
          )}
        </ToolbarMenu>
      )}
    </div>
  );
}