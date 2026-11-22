import React, { useState } from 'react';
import { LayoutGrid, ListFilter, ChevronRight, Check, X, Download, FileSpreadsheet, FileText, Presentation } from 'lucide-react';
import { cn } from '@/lib/utils';
import OptionLabel, { isDottedColumn } from '@/components/shared/OptionLabel';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import SortMenu from '@/components/risk/register/SortMenu';
import { SORT_OPTIONS } from '@/lib/registerSort';
import { discreteColumns, colId, colLabel, valuesFor } from '@/lib/tasks/taskView';

import ToolbarButton from '@/components/shared/table/ToolbarButton';

/** Group / Filter / Sort / Export toolbar for any task + milestone table. */
export default function TaskToolbar({ tasks = [], columns = [], filters = {}, onFilter, onClearFilters, groupBy = '', onGroup, onClearGroup, sort, onSort, onExport, showSort = true, chartsMode = false }) {
  const [openMenu, setOpenMenu] = useState(null);
  const [pickedField, setPickedField] = useState(null);
  const fields = discreteColumns(columns);
  const filterCount = Object.keys(filters).filter((k) => filters[k]).length;
  const toggle = (name) => setOpenMenu((m) => (m === name ? null : name));

  return (
    <div className="flex items-center gap-2">
      <div className={cn('flex items-center gap-2', chartsMode && 'opacity-40 pointer-events-none cursor-not-allowed')}>
      <div className="relative">
        <ToolbarButton icon={LayoutGrid} label="Group" active={!!groupBy} onClick={() => toggle('group')} />
        {openMenu === 'group' && (
          <ToolbarMenu onClose={() => setOpenMenu(null)}>
            <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group by</div>
            {fields.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No groupable columns</div>}
            {fields.map((c) => (
              <button key={colId(c)} onClick={() => { onGroup(colId(c)); setOpenMenu(null); }} className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
                {colLabel(c)}
                {groupBy === colId(c) && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
            {groupBy && (
              <>
                <div className="my-1 border-t border-border" />
                <button onClick={() => { onClearGroup(); setOpenMenu(null); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left">
                  <X className="w-3.5 h-3.5" /> Clear Group
                </button>
              </>
            )}
          </ToolbarMenu>
        )}
      </div>

      <div className="relative">
        <ToolbarButton icon={ListFilter} label="Filter" active={filterCount > 0} onClick={() => { toggle('filter'); setPickedField(null); }}
          badge={filterCount > 0 ? <span className="text-xs">({filterCount})</span> : null} />
        {openMenu === 'filter' && (
          <ToolbarMenu onClose={() => setOpenMenu(null)}>
            {!pickedField ? (
              <>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
                {fields.length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">No filterable columns</div>}
                {fields.map((c) => (
                  <button key={colId(c)} onClick={() => setPickedField(c)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                    <span className="flex items-center gap-2">
                      {colLabel(c)}
                      {filters[colId(c)] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </button>
                ))}
                <FilterFooter onClear={() => { onClearFilters(); setOpenMenu(null); }} onApply={() => setOpenMenu(null)} count={filterCount} />
              </>
            ) : (
              <>
                <button onClick={() => setPickedField(null)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
                  <ChevronRight className="w-3 h-3 rotate-180" /> {colLabel(pickedField)}
                </button>
                <div className="py-1">
                  <button onClick={() => onFilter(colId(pickedField), '')} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                    All {colLabel(pickedField)}
                    {!filters[colId(pickedField)] && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                  {valuesFor(tasks.filter((t) => t.type !== 'section'), pickedField).map((v) => (
                    <button key={v} onClick={() => onFilter(colId(pickedField), v)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                      {isDottedColumn(pickedField)
                        ? <OptionLabel name={v} color={(pickedField.options || []).find((o) => o.name === v)?.color} dotted />
                        : v}
                      {filters[colId(pickedField)] === v && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
                <FilterFooter onClear={() => onFilter(colId(pickedField), '')} onApply={() => setOpenMenu(null)} />
              </>
            )}
          </ToolbarMenu>
        )}
      </div>

      {showSort && <SortMenu options={[SORT_OPTIONS.due_date]} sort={sort} onChange={onSort} />}
      </div>

      <div className="relative">
        <ToolbarButton icon={Download} label="Export" onClick={() => toggle('export')} />
        {openMenu === 'export' && (
          <ToolbarMenu onClose={() => setOpenMenu(null)}>
            {chartsMode ? (
              <>
                <button onClick={() => { onExport('chart-pdf'); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
                  <FileText className="w-4 h-4 text-red-600" /> Download PDF
                </button>
                <button onClick={() => { onExport('chart-ppt'); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
                  <Presentation className="w-4 h-4 text-orange-600" /> Download PPT
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { onExport('excel'); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
                  <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
                </button>
                <button onClick={() => { onExport('pdf'); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
                  <FileText className="w-4 h-4 text-red-600" /> Export to PDF
                </button>
              </>
            )}
          </ToolbarMenu>
        )}
      </div>
    </div>
  );
}