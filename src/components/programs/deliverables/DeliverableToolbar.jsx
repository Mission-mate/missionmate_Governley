import React, { useState } from 'react';
import { Search, LayoutGrid, ListFilter, ChevronRight, Check, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import { distinctValues } from '@/lib/programs/deliverableView';

const HEAD = 'px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider';
const ITEM = 'w-full flex items-center justify-between gap-3 px-3 py-1.5 text-sm hover:bg-muted/50 text-left';

/** Search / Group / Filter / Export — mirrors the Strategy register toolbar. */
export default function DeliverableToolbar({ rows, fields, search, onSearch, groupBy, onGroup, filters, onFilter, onClearFilters, onExport }) {
  const [menu, setMenu] = useState(null);
  const [picked, setPicked] = useState(null);
  const filterCount = Object.values(filters).filter(Boolean).length;
  const toggle = (m) => setMenu((x) => (x === m ? null : m));
  const close = () => setMenu(null);
  const sections = [fields.filter((f) => !f.custom), fields.filter((f) => f.custom)];

  const list = (render) => sections.map((s, i) => s.length > 0 && (
    <React.Fragment key={i}>
      {i === 1 && <><div className="my-1 border-t border-border" /><div className={HEAD}>Custom Fields</div></>}
      {s.map(render)}
    </React.Fragment>
  ));

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative w-[260px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name" value={search} onChange={(e) => onSearch(e.target.value)} className="pl-9 h-9 text-sm rounded-md" />
      </div>

      <div className="relative">
        <ToolbarButton icon={LayoutGrid} label="Group" active={!!groupBy} onClick={() => toggle('group')} />
        {menu === 'group' && (
          <ToolbarMenu onClose={close}>
            <div className={HEAD}>Group by</div>
            {list((f) => (
              <button key={f.key} onClick={() => { onGroup(groupBy === f.key ? '' : f.key); close(); }} className={ITEM}>
                <span className="truncate">{f.label}</span>{groupBy === f.key && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              </button>
            ))}
            {groupBy && (<><div className="my-1 border-t border-border" />
              <button onClick={() => { onGroup(''); close(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left"><X className="w-3.5 h-3.5" /> Clear Group</button></>)}
          </ToolbarMenu>
        )}
      </div>

      <div className="relative">
        <ToolbarButton icon={ListFilter} label="Filter" active={!!filterCount} badge={<FilterCountBadge count={filterCount} />} onClick={() => { toggle('filter'); setPicked(null); }} />
        {menu === 'filter' && (
          <ToolbarMenu onClose={close}>
            {!picked ? (<>
              <div className={HEAD}>Filter by</div>
              {list((f) => (
                <button key={f.key} onClick={() => setPicked(f)} className={ITEM}>
                  <span className="flex items-center gap-2 min-w-0"><span className="truncate">{f.label}</span>
                    {filters[f.key] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                </button>
              ))}
              <FilterFooter onClear={() => { onClearFilters(); close(); }} onApply={close} count={filterCount} />
            </>) : (<>
              <button onClick={() => setPicked(null)} className={`w-full flex items-center gap-1 ${HEAD} py-2 hover:text-foreground text-left border-b border-border`}>
                <ChevronRight className="w-3 h-3 rotate-180" /> {picked.label}
              </button>
              <div className="py-1">
                {['', ...distinctValues(rows, picked)].map((v) => (
                  <button key={v || 'all'} onClick={() => onFilter(picked.key, v)} className={ITEM}>
                    {v || `All ${picked.label}`}{(filters[picked.key] || '') === v && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                ))}
              </div>
              <FilterFooter onClear={() => onFilter(picked.key, '')} onApply={close} />
            </>)}
          </ToolbarMenu>
        )}
      </div>

      <div className="relative">
        <ToolbarButton icon={Download} label="Export" onClick={() => toggle('export')} />
        {menu === 'export' && (
          <ToolbarMenu onClose={close}>
            <button onClick={() => { onExport('excel'); close(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel</button>
            <button onClick={() => { onExport('pdf'); close(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap"><FileText className="w-4 h-4 text-red-600" /> Export to PDF</button>
          </ToolbarMenu>
        )}
      </div>
    </div>
  );
}