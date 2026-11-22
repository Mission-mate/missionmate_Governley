import React, { useState, useRef, useEffect } from 'react';
import { ListFilter, ChevronRight, Check, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPdf } from '@/lib/workPlanExport';
import ExportWorkItemsDialog from '@/components/board/workplan/ExportWorkItemsDialog';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import { dueMonthLabel, dueQuarterLabel } from '@/lib/workPlanApi';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

/** Priority, Status and Category are groupable / filterable (in this order) */
const PICKABLE_ORDER = ['priority', 'status', 'category'];

/** The Filter menu additionally offers Month (listed before Quarter). */
const FILTER_PERIOD_FIELDS = [
  { id: 'month', label: 'Month', synthetic: true },
  { id: 'quarter', label: 'Quarter', synthetic: true },
];

function configurable(fields) {
  return PICKABLE_ORDER.map((id) => fields.find((f) => f.id === id)).filter(Boolean);
}


function filterableFields(fields) {
  return [...FILTER_PERIOD_FIELDS, ...configurable(fields)];
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
        'animate-dropdown-enter absolute top-full mt-1.5 z-50 min-w-[220px] bg-white border border-border rounded-lg shadow-lg py-1.5',
        align === 'right' ? 'right-0' : 'left-0'
      )}
    >
      {children}
    </div>
  );
}

/** Distinct period labels derived from the items' due dates, in date order. */
function periodValues(items, labelOf) {
  const dates = items.map((o) => o.due_date).filter(Boolean).sort();
  return [...new Set(dates.map(labelOf).filter(Boolean))];
}

function valuesFor(field, workPlan, items) {
  if (field.id === 'quarter') return periodValues(items, (d) => dueQuarterLabel(d, workPlan));
  if (field.id === 'month') return periodValues(items, dueMonthLabel);
  if (field.id === 'status') return ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
  const cfgOpts = field.config?.options;
  if (cfgOpts?.length) return cfgOpts.map((o) => (typeof o === 'object' ? o.name : o));
  return [];
}

function FilterMenu({ fields, items, workPlan, activeFilters, onApply, onClear, onClose }) {
  const [pickedField, setPickedField] = useState(null);
  const activeCount = Object.keys(activeFilters).length;

  return (
    <Menu open onClose={onClose}>
      {!pickedField ? (
        <>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
          {filterableFields(fields).map((f) => (
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
            {valuesFor(pickedField, workPlan, items).map((v) => (
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
function scopeItems(items, scope, selectedItems) {
  if (scope === 'all') return items;
  if (scope === 'selected') return selectedItems;
  return items.filter((o) => (o.status || 'Not Started') === scope);
}

export default function WorkItemToolbar({
  fields, workPlan, items, activeFilters, onApplyFilter, onClearFilter,
  tableColumns, workPlanTitle, selectedItems = [],
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDialog, setExportDialog] = useState(null); // 'pdf' | 'excel' | null
  const filterCount = Object.keys(activeFilters).length;

  const handleExport = (scope) => {
    const scoped = scopeItems(items, scope, selectedItems);
    if (exportDialog === 'pdf') exportToPdf(scoped, tableColumns, workPlanTitle);
    else exportToExcel(scoped, fields, workPlanTitle);
    setExportDialog(null);
  };

  const closeAll = () => { setFilterOpen(false); setExportOpen(false); };

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
            fields={fields} items={items} workPlan={workPlan} activeFilters={activeFilters}
            onApply={onApplyFilter} onClear={onClearFilter} onClose={() => setFilterOpen(false)}
          />
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

      <ExportWorkItemsDialog
        isOpen={!!exportDialog}
        format={exportDialog || 'pdf'}
        selectedCount={selectedItems.length}
        onClose={() => setExportDialog(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}