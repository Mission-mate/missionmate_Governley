import React, { useState } from 'react';
import { ChevronRight, Check } from 'lucide-react';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import ToolbarMenuShell, { MENU_HEADING, MENU_ITEM } from './ToolbarMenuShell';

export default function AssetFilterMenu({ fields, activeFilters, onApply, onClear, onClose }) {
  const [picked, setPicked] = useState(null);
  const activeCount = Object.keys(activeFilters).length;

  if (!picked) {
    return (
      <ToolbarMenuShell onClose={onClose}>
        <div className={MENU_HEADING}>Filter by</div>
        {fields.map((f) => (
          <button key={f.id} onClick={() => setPicked(f)} className={MENU_ITEM}>
            <span className="flex items-center gap-2">
              {f.label}
              {activeFilters[f.id] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          </button>
        ))}
        <FilterFooter onClear={() => { onClear(); onClose(); }} onApply={onClose} count={activeCount} />
      </ToolbarMenuShell>
    );
  }

  return (
    <ToolbarMenuShell onClose={onClose}>
      <button onClick={() => setPicked(null)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
        <ChevronRight className="w-3 h-3 rotate-180" /> {picked.label}
      </button>
      <div className="py-1 max-h-72 overflow-y-auto">
        <button onClick={() => onApply(picked.id, '')} className={MENU_ITEM}>
          All {picked.label}
          {!activeFilters[picked.id] && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>
        {picked.values.map((v) => (
          <button key={v} onClick={() => onApply(picked.id, v)} className={MENU_ITEM}>
            {picked.labels?.[v] || v}
            {activeFilters[picked.id] === v && <Check className="w-3.5 h-3.5 text-primary" />}
          </button>
        ))}
      </div>
      <FilterFooter onClear={() => onApply(picked.id, '')} onApply={onClose} />
    </ToolbarMenuShell>
  );
}