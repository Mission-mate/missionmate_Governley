import React, { useState } from 'react';
import { Check, X, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { SORT_FIELDS } from '@/lib/assetRegisterView';
import ToolbarMenuShell, { MENU_HEADING, MENU_ITEM } from './ToolbarMenuShell';

const DIRECTIONS = [
  { id: 'asc', label: 'Oldest to Newest', icon: ArrowUp },
  { id: 'desc', label: 'Newest to Oldest', icon: ArrowDown },
];

/** Field-then-direction sort picker. sort = { field, direction } | null */
export default function AssetSortMenu({ sort, onApply, onClear, onClose, sortFields = SORT_FIELDS }) {
  const [picked, setPicked] = useState(null);

  return (
    <ToolbarMenuShell onClose={onClose}>
      {!picked ? (
        <>
          <div className={MENU_HEADING}>Sort by</div>
          {sortFields.map((f) => (
            <button key={f.id} onClick={() => setPicked(f)} className={MENU_ITEM}>
              <span className="flex items-center gap-2">
                {f.label}
                {sort?.field === f.id && <Check className="w-3.5 h-3.5 text-primary" />}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            </button>
          ))}
          {sort && (
            <>
              <div className="my-1 border-t border-border" />
              <button onClick={() => { onClear(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left">
                <X className="w-3.5 h-3.5" /> Clear Sort
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setPicked(null)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
            <ChevronRight className="w-3 h-3 rotate-180" /> {picked.label}
          </button>
          <div className="py-1">
            {DIRECTIONS.map(({ id, label, icon: Icon }) => (
              <button key={id} onClick={() => { onApply({ field: picked.id, direction: id }); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
                <Icon className="w-3.5 h-3.5 text-muted-foreground" /> {label}
                {sort?.field === picked.id && sort.direction === id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
              </button>
            ))}
          </div>
        </>
      )}
    </ToolbarMenuShell>
  );
}