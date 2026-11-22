import React, { useState, useRef, useEffect } from 'react';
import { Search, LayoutGrid, ListFilter, ChevronRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import ToolbarButton, { TOOLBAR_SEARCH_INPUT } from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

function Menu({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => {if (ref.current && !ref.current.contains(e.target)) onClose();};
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div
      ref={ref}
      className="animate-dropdown-enter absolute top-full right-0 mt-1.5 z-50 min-w-[220px] max-h-[320px] overflow-y-auto bg-popover text-popover-foreground border border-border rounded-lg shadow-lg py-1.5">
      
      {children}
    </div>);

}

/**
 * Search + Group + Filter toolbar, matching the Compliance Calendar pattern.
 * fields: [{ key, label, values: string[] }]
 */
export default function DataToolbar({
  search, onSearchChange, placeholder = 'Search...',
  fields = [], groupBy, onGroupBy, filters = {}, onFilterChange, onClearFilters
}) {
  const [groupOpen, setGroupOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [pickedField, setPickedField] = useState(null);
  const filterCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className={cn(TOOLBAR_SEARCH_INPUT, 'w-56')} />
        
      </div>

      <div className="relative">
        <ToolbarButton
          icon={LayoutGrid}
          label="Group"
          active={!!groupBy}
          onClick={() => {setFilterOpen(false);setGroupOpen((v) => !v);}} />
        {groupOpen &&
        <Menu onClose={() => setGroupOpen(false)}>
            <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group by</div>
            {fields.map((f) =>
          <button
            key={f.key}
            onClick={() => {onGroupBy(f.key);setGroupOpen(false);}}
            className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
            
                {f.label}
                {groupBy === f.key && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
          )}
            {groupBy &&
          <>
                <div className="my-1 border-t border-border" />
                <button
              onClick={() => {onGroupBy(null);setGroupOpen(false);}}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left">
              
                  <X className="w-3.5 h-3.5" /> Clear Group
                </button>
              </>
          }
          </Menu>
        }
      </div>

      <div className="relative">
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => {setGroupOpen(false);setPickedField(null);setFilterOpen((v) => !v);}} />
        {filterOpen &&
        <Menu onClose={() => setFilterOpen(false)}>
            {!pickedField ?
          <>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
                {fields.map((f) =>
            <button
              key={f.key}
              onClick={() => setPickedField(f)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
              
                    <span className="flex items-center gap-2">
                      {f.label}
                      {filters[f.key] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </button>
            )}
                <FilterFooter onClear={() => {onClearFilters();setFilterOpen(false);}} onApply={() => setFilterOpen(false)} count={filterCount} />
              </> :

          <>
                <button
              onClick={() => setPickedField(null)}
              className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
              
                  <ChevronRight className="w-3 h-3 rotate-180" /> {pickedField.label}
                </button>
                <div className="py-1">
                  <button
                onClick={() => onFilterChange(pickedField.key, '')}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                
                    All {pickedField.label}
                    {!filters[pickedField.key] && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                  {pickedField.values.map((v) =>
              <button
                key={v}
                onClick={() => onFilterChange(pickedField.key, v)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                
                      {v}
                      {filters[pickedField.key] === v && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
              )}
                </div>
                <FilterFooter onClear={() => onFilterChange(pickedField.key, '')} onApply={() => setFilterOpen(false)} />
              </>
          }
          </Menu>
        }
      </div>
    </div>);

}