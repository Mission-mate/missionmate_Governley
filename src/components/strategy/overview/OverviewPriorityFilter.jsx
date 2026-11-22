import React, { useState } from 'react';
import { ListFilter, ChevronRight, Check } from 'lucide-react';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

/** Filter the Overview tree by a single Priority — styled to match the level table toolbars. */
export default function OverviewPriorityFilter({ label, priorities, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState(false);

  return (
    <div className="relative">
      <ToolbarButton
        icon={ListFilter}
        label="Filter"
        active={!!value}
        badge={<FilterCountBadge count={value ? 1 : 0} />}
        onClick={() => { setOpen((o) => !o); setPicked(false); }}
      />
      {open && (
        <ToolbarMenu onClose={() => setOpen(false)}>
          {!picked ? (
            <>
              <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
              <button onClick={() => setPicked(true)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                <span className="flex items-center gap-2">
                  {label}
                  {value && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
              </button>
              <FilterFooter onClear={() => { onChange(null); setOpen(false); }} onApply={() => setOpen(false)} count={value ? 1 : 0} />
            </>
          ) : (
            <>
              <button onClick={() => setPicked(false)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
                <ChevronRight className="w-3 h-3 rotate-180" /> {label}
              </button>
              <div className="py-1 max-h-[280px] overflow-y-auto">
                <button onClick={() => onChange(null)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                  All {label}
                  {!value && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
                {priorities.map((p) => (
                  <button key={p.id} onClick={() => onChange(p.id)} className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-left">
                    <span className="truncate">
                      {p.custom_id && <span className="text-muted-foreground mr-1.5">{p.custom_id}</span>}
                      {p.title}
                    </span>
                    {value === p.id && <Check className="w-3.5 h-3.5 shrink-0 text-primary" />}
                  </button>
                ))}
              </div>
              <FilterFooter onClear={() => onChange(null)} onApply={() => setOpen(false)} />
            </>
          )}
        </ToolbarMenu>
      )}
    </div>
  );
}