import React, { useState } from 'react';
import { Search, LayoutGrid, ListFilter, ChevronRight, Check, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import { BLOCK_FIELDS, blockFieldValues } from '@/lib/strategy/blockTableView';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

/** Search / Group / Filter / Export toolbar shared by every strategy level table. */
export default function StrategyTableToolbar({
  rows = [],
  search = '',
  onSearch,
  groupBy = '',
  onGroup,
  onClearGroup,
  filters = {},
  onFilter,
  onClearFilters,
  onExport,
  fields = BLOCK_FIELDS,
}) {
  const [openMenu, setOpenMenu] = useState(null);
  const [pickedField, setPickedField] = useState(null);
  const filterCount = Object.keys(filters).filter((k) => filters[k]).length;
  const toggle = (name) => setOpenMenu((m) => (m === name ? null : name));
  // Custom columns from the Strategy Customiser sit under their own divider.
  const systemFields = fields.filter((f) => !f.custom);
  const customFields = fields.filter((f) => f.custom);

  const SectionDivider = ({ label }) => (
    <>
      <div className="my-1 border-t border-border" />
      <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{label}</div>
    </>
  );

  const groupButton = (f) => (
    <button
      key={f.key}
      onClick={() => { if (groupBy === f.key) onClearGroup(); else onGroup(f.key); setOpenMenu(null); }}
      className="w-full flex items-center justify-between gap-3 px-3 py-1.5 text-sm hover:bg-muted/50 text-left"
    >
      <span className="truncate">{f.label}</span>
      {groupBy === f.key && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
    </button>
  );

  const filterButton = (f) => (
    <button key={f.key} onClick={() => setPickedField(f)} className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm hover:bg-muted/50 text-left">
      <span className="flex items-center gap-2 min-w-0">
        <span className="truncate">{f.label}</span>
        {filters[f.key] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none shrink-0">1</span>}
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
    </button>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative w-[260px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or ID"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          data-toolbar-control=""
          className="pl-9 h-9 text-sm rounded-md"
        />
      </div>

      <div className="relative">
        <ToolbarButton icon={LayoutGrid} label="Group" active={!!groupBy} onClick={() => toggle('group')} />
        {openMenu === 'group' && (
          <ToolbarMenu onClose={() => setOpenMenu(null)}>
            <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group by</div>
            {systemFields.map(groupButton)}
            {customFields.length > 0 && <SectionDivider label="Custom Fields" />}
            {customFields.map(groupButton)}
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
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => { toggle('filter'); setPickedField(null); }}
        />
        {openMenu === 'filter' && (
          <ToolbarMenu onClose={() => setOpenMenu(null)}>
            {!pickedField ? (
              <>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
                {systemFields.map(filterButton)}
                {customFields.length > 0 && <SectionDivider label="Custom Fields" />}
                {customFields.map(filterButton)}
                <FilterFooter onClear={() => { onClearFilters(); setOpenMenu(null); }} onApply={() => setOpenMenu(null)} count={filterCount} />
              </>
            ) : (
              <>
                <button onClick={() => setPickedField(null)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
                  <ChevronRight className="w-3 h-3 rotate-180" /> {pickedField.label}
                </button>
                <div className="py-1">
                  <button onClick={() => onFilter(pickedField.key, '')} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                    All {pickedField.label}
                    {!filters[pickedField.key] && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                  {blockFieldValues(rows, pickedField).map((v) => (
                    <button key={v} onClick={() => onFilter(pickedField.key, v)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                      {v}
                      {filters[pickedField.key] === v && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
                <FilterFooter onClear={() => onFilter(pickedField.key, '')} onApply={() => setOpenMenu(null)} />
              </>
            )}
          </ToolbarMenu>
        )}
      </div>

      <div className="relative">
        <ToolbarButton icon={Download} label="Export" onClick={() => toggle('export')} />
        {openMenu === 'export' && (
          <ToolbarMenu onClose={() => setOpenMenu(null)}>
            <button onClick={() => { onExport('excel'); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
            </button>
            <button onClick={() => { onExport('pdf'); setOpenMenu(null); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
              <FileText className="w-4 h-4 text-red-600" /> Export to PDF
            </button>
          </ToolbarMenu>
        )}
      </div>
    </div>
  );
}