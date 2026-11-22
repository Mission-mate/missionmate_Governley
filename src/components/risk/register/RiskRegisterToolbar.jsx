import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ListFilter, ChevronRight, Check, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPdf } from '@/lib/riskExport';
import SortMenu from './SortMenu';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import { SORT_OPTIONS } from '@/lib/registerSort';
import ExportScopeDialog from '@/components/shared/export/ExportScopeDialog';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

// Legacy "Active" status counts as Open.
const normStatus = (r) => (r.status === 'Closed' ? 'Closed' : 'Open');
const STATUS_SCOPE = [
  { value: 'Open', label: 'Open Risks' },
  { value: 'Closed', label: 'Closed Risks' },
];

// Discrete-value columns eligible for filtering / grouping.
const FILTER_FIELDS = [
  { id: 'category', label: 'Risk Category' },
  { id: 'owner', label: 'Owner' },
  { id: 'residual_rating', label: 'Residual Risk Rating' },
  { id: 'status', label: 'Risk Status' },
  { id: 'risk_appetite', label: 'Risk Appetite' },
  { id: 'treatment_action', label: 'Treatment Strategy' },
  { id: 'review_frequency', label: 'Review Frequency' },
];

// Grouping limited to a few key categorical fields.
const GROUP_FIELDS = [
  { id: 'category', label: 'Risk Category' },
  { id: 'status', label: 'Risk Status' },
  { id: 'residual_rating', label: 'Residual Risk Rating' },
  { id: 'risk_appetite', label: 'Risk Appetite' },
];

function Menu({ open, onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div ref={ref} className="animate-dropdown-enter absolute top-full mt-1.5 right-0 z-50 min-w-[220px] bg-popover border border-border rounded-lg shadow-lg py-1.5">
      {children}
    </div>
  );
}

function FilterMenu({ risks, activeFilters, onApply, onClear, onClose }) {
  const [pickedField, setPickedField] = useState(null);

  const valuesFor = (field) => {
    const vals = new Set();
    risks.forEach((r) => { const v = r[field.id] || (field.id === 'status' ? 'Active' : null); if (v) vals.add(v); });
    return [...vals].sort();
  };

  const activeCount = Object.keys(activeFilters).length;

  return (
    <Menu open onClose={onClose}>
      {!pickedField ? (
        <>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
          {FILTER_FIELDS.map((f) => (
            <button key={f.id} onClick={() => setPickedField(f)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
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
            {valuesFor(pickedField).map((v) => (
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

function GroupMenu({ groupBy, onApply, onClear, onClose }) {
  return (
    <Menu open onClose={onClose}>
      <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group by</div>
      {GROUP_FIELDS.map((f) => (
        <button key={f.id} onClick={() => { onApply(f.id); onClose(); }} className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
          {f.label}
          {groupBy === f.id && <Check className="w-3.5 h-3.5 text-primary" />}
        </button>
      ))}
      {groupBy && (
        <>
          <div className="my-1 border-t border-border" />
          <button onClick={() => { onClear(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left">
            <X className="w-3.5 h-3.5" /> Clear Group
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

export default function RiskRegisterToolbar({
  risks, activeFilters, onApplyFilter, onClearFilter,
  groupBy, onApplyGroup, onClearGroup,
  sort, onChangeSort, categoryOptions = [], selectedRows = [],
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState(null);

  const runExport = (scope) => {
    const selectedScope = scope === 'selected';
    const statuses = selectedScope ? null : scope;
    const rows = selectedScope ? selectedRows : statuses ? risks.filter((r) => statuses.includes(normStatus(r))) : risks;
    const label = selectedScope
      ? 'Selected Risks'
      : statuses ? statuses.map((s) => `${s} Risks`).join(', ') : 'All Risks';
    const run = exportFormat === 'excel' ? exportToExcel : exportToPdf;
    run(rows, 'Risk Register', label, categoryOptions);
    setExportFormat(null);
  };
  const filterCount = Object.keys(activeFilters).length;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <ToolbarButton
          icon={LayoutGrid}
          label="Group"
          active={!!groupBy}
          onClick={() => { setGroupOpen((o) => !o); setFilterOpen(false); }}
        />
        {groupOpen && <GroupMenu groupBy={groupBy} onApply={onApplyGroup} onClear={onClearGroup} onClose={() => setGroupOpen(false)} />}
      </div>

      <div className="relative">
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => { setFilterOpen((o) => !o); setGroupOpen(false); }}
        />
        {filterOpen && (
          <FilterMenu risks={risks} activeFilters={activeFilters} onApply={onApplyFilter} onClear={onClearFilter} onClose={() => setFilterOpen(false)} />
        )}
      </div>

      <SortMenu options={[SORT_OPTIONS.rating, SORT_OPTIONS.next_review]} sort={sort} onChange={onChangeSort} />

      <div className="relative">
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={() => { setExportOpen((o) => !o); setFilterOpen(false); setGroupOpen(false); }}
        />
        {exportOpen && (
          <ExportMenu
            onClose={() => setExportOpen(false)}
            onExcel={() => setExportFormat('excel')}
            onPdf={() => setExportFormat('pdf')}
          />
        )}
      </div>

      <ExportScopeDialog
        isOpen={!!exportFormat}
        format={exportFormat === 'excel' ? 'excel' : 'pdf'}
        itemLabel="risks"
        allLabel="All Risks"
        selectedLabel="Selected Risks"
        selectedCount={selectedRows.length}
        options={STATUS_SCOPE}
        onClose={() => setExportFormat(null)}
        onConfirm={runExport}
      />
    </div>
  );
}