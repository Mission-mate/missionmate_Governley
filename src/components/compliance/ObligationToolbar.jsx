import React, { useState, useRef, useEffect } from 'react';
import { ListFilter, ChevronRight, Check, X, Download, FileSpreadsheet, FileText, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPdf } from '@/lib/complianceExport';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import { QUARTER_LABELS, orderedMonths } from '@/components/compliance/calendar/periodGrouping';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

/** Priority, Status, Category and Regulator are filterable (in this order) */
const PICKABLE_ORDER = ['priority', 'status', 'category', 'regulator'];

/** Synthetic period-based options (computed from due_date, not real config fields). */
const PERIOD_FIELDS = [
  { id: 'quarter', label: 'Quarter', synthetic: true },
  { id: 'month', label: 'Month', synthetic: true },
];

function pickableFields(fields) {
  return [
    ...PERIOD_FIELDS,
    ...PICKABLE_ORDER.map((id) => fields.find((f) => f.id === id)).filter(Boolean),
  ];
}

function Menu({ open, onClose, children, align = 'right' }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      ref={ref}
      className={cn(
        'animate-dropdown-enter absolute top-full mt-1.5 z-50 min-w-[220px] bg-popover text-popover-foreground border border-border rounded-lg shadow-lg py-1.5',
        align === 'right' ? 'right-0' : 'left-0'
      )}
    >
      {children}
    </div>
  );
}

function valuesFor(field, periodType) {
  if (field.id === 'quarter') return QUARTER_LABELS;
  if (field.id === 'month') return orderedMonths(periodType);
  if (field.id === 'status') return ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
  const cfgOpts = field.config?.options;
  if (cfgOpts?.length) return cfgOpts.map((o) => (typeof o === 'object' ? o.name : o));
  return [];
}

function FilterMenu({ fields, periodType, activeFilters, onApply, onClear, onClose }) {
  const [pickedField, setPickedField] = useState(null);
  const activeCount = Object.keys(activeFilters).length;

  return (
    <Menu open onClose={onClose}>
      {!pickedField ? (
        <>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
          {pickableFields(fields).map((f) => (
            <button
              key={f.id}
              onClick={() => setPickedField(f)}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left"
            >
              <span className="flex items-center gap-2">
                {f.label}
                {activeFilters[f.id] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            </button>
          ))}
          <FilterFooter onClear={() => { onClear(); onClose(); }} onApply={onClose} count={activeCount} />
        </>
      ) : (
        <>
          <button onClick={() => setPickedField(null)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
            <ChevronRight className="w-3 h-3 rotate-180" /> {pickedField.label}
          </button>
          <div className="py-1">
            <button onClick={() => onApply(pickedField.id, '')} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
              All {pickedField.label}
              {!activeFilters[pickedField.id] && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
            {valuesFor(pickedField, periodType).map((v) => (
              <button key={v} onClick={() => onApply(pickedField.id, v)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                {v}
                {activeFilters[pickedField.id] === v && <Check className="w-3.5 h-3.5 text-primary" />}
              </button>
            ))}
          </div>
          <FilterFooter onClear={() => onApply(pickedField.id, '')} onApply={onClose} />
        </>
      )}
    </Menu>
  );
}

function SortMenu({ sortDir, onApply, onClear, onClose }) {
  return (
    <Menu open onClose={onClose}>
      <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Sort by</div>
      <p className="px-3 py-1 text-sm font-semibold text-foreground">Due Date</p>
      <button onClick={() => { onApply('asc'); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
        <ArrowUp className="w-3.5 h-3.5 text-muted-foreground" /> Oldest to Newest
        {sortDir === 'asc' && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
      </button>
      <button onClick={() => { onApply('desc'); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
        <ArrowDown className="w-3.5 h-3.5 text-muted-foreground" /> Newest to Oldest
        {sortDir === 'desc' && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
      </button>
      {sortDir && (
        <>
          <div className="my-1 border-t border-border" />
          <button onClick={() => { onClear(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left">
            <X className="w-3.5 h-3.5" /> Clear Sort
          </button>
        </>
      )}
    </Menu>
  );
}

function ExportMenu({ onClose, onExcel, onPdf }) {
  return (
    <Menu open onClose={onClose}>
      <button onClick={() => { onExcel(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
        <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
      </button>
      <button onClick={() => { onPdf(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
        <FileText className="w-4 h-4 text-red-600" /> Export to PDF
      </button>
    </Menu>
  );
}

// scope: 'all', 'selected', or a status name
function scopeObligations(obligations, scope, selectedObligations) {
  if (scope === 'all') return obligations;
  if (scope === 'selected') return selectedObligations;
  return obligations.filter((o) => (o.status || 'Not Started') === scope);
}

export default function ObligationToolbar({
  fields, periodType, obligations, activeFilters, onApplyFilter, onClearFilter,
  sortDir, onApplySort, onClearSort,
  tableColumns, registerTitle, selectedObligations = [],
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDialog, setExportDialog] = useState(null); // 'pdf' | 'excel' | null
  const filterCount = Object.keys(activeFilters).length;

  const handleExport = (scope) => {
    const scoped = scopeObligations(obligations, scope, selectedObligations);
    if (exportDialog === 'pdf') exportToPdf(scoped, tableColumns, registerTitle);
    else exportToExcel(scoped, fields, registerTitle);
    setExportDialog(null);
  };

  const closeAll = () => { setFilterOpen(false); setSortOpen(false); setExportOpen(false); };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => { const v = !filterOpen; closeAll(); setFilterOpen(v); }}
        />
        {filterOpen && (
          <FilterMenu
            fields={fields} periodType={periodType} activeFilters={activeFilters}
            onApply={onApplyFilter} onClear={onClearFilter} onClose={() => setFilterOpen(false)}
          />
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          icon={ArrowUpDown}
          label="Sort"
          active={!!sortDir}
          onClick={() => { const v = !sortOpen; closeAll(); setSortOpen(v); }}
        />
        {sortOpen && (
          <SortMenu sortDir={sortDir} onApply={onApplySort} onClear={onClearSort} onClose={() => setSortOpen(false)} />
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={() => { const v = !exportOpen; closeAll(); setExportOpen(v); }}
        />
        {exportOpen && (
          <ExportMenu
            onClose={() => setExportOpen(false)}
            onExcel={() => setExportDialog('excel')}
            onPdf={() => setExportDialog('pdf')}
          />
        )}
      </div>

      <ExportObligationsDialog
        isOpen={!!exportDialog}
        format={exportDialog || 'pdf'}
        selectedCount={selectedObligations.length}
        onClose={() => setExportDialog(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}