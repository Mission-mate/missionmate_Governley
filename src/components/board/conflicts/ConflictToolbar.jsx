import React, { useState, useRef, useEffect } from 'react';
import AssetSortMenu from '@/components/compliance/assets/toolbar/AssetSortMenu';
import { LayoutGrid, ListFilter, ArrowUpDown, ChevronRight, Check, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportToExcel, exportToPdf } from '@/lib/conflictExport';
import ExportConflictModal from './ExportConflictModal';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import { useConflictScope } from '@/lib/conflictScope';

const TOP_LEVEL = ['member_name', 'date_of_disclosure', 'committee_notified', 'status', 'conflict_type', 'review_frequency', 'next_review_date', 'risk_exposure', 'approved_by'];

// Synthetic field for the built-in member, exposed as the first group/filter option.
const personField = (label) => ({ id: 'member_name', label, type: 'Text/Number', config: {} });

function filterableFields(fields, label) {
  return [personField(label), ...fields.filter(f => ['Single Select', 'Multi Select', 'Text/Number'].includes(f.type) && !['description', 'approved_by', 'status'].includes(f.id))];
}
function groupableFields(fields, label) {
  return [personField(label), ...fields.filter(f => f.type === 'Single Select' && f.id !== 'status')];
}

const SORT_FIELDS = [
  { id: 'date_of_disclosure', label: 'Date of Declaration' },
  { id: 'last_review_date', label: 'Last Review Date' },
  { id: 'next_review_date', label: 'Next Review Date' },
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
    <div ref={ref} className="animate-dropdown-enter absolute top-full right-0 mt-1.5 z-50 min-w-[220px] bg-white border border-border rounded-lg shadow-lg py-1.5">
      {children}
    </div>
  );
}

function FilterMenu({ fields, conflicts, activeFilters, onApply, onClear, onClose }) {
  const { personLabel } = useConflictScope();
  const [picked, setPicked] = useState(null);
  const valuesFor = (field) => {
    const cfgOpts = field.config?.options;
    if (cfgOpts?.length) return cfgOpts.map(o => (typeof o === 'object' ? o.name : o));
    const vals = new Set();
    conflicts.forEach(c => {
      const v = TOP_LEVEL.includes(field.id) ? c[field.id] : c.custom_fields?.[field.id];
      if (v) vals.add(v);
    });
    return [...vals];
  };
  const hasActive = Object.keys(activeFilters).length > 0;
  return (
    <Menu open onClose={onClose}>
      {!picked ? (
        <>
          <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
          {filterableFields(fields, personLabel).map(f => (
            <button key={f.id} onClick={() => setPicked(f)} className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">
              <span className="flex items-center gap-2">
                {f.label}
                {activeFilters[f.id] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
            </button>
          ))}
          {hasActive && (
            <>
              <div className="my-1 border-t border-border" />
              <button onClick={() => { onClear(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left"><X className="w-3.5 h-3.5" /> Clear Filter</button>
            </>
          )}
        </>
      ) : (
        <>
          <button onClick={() => setPicked(null)} className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1 hover:text-foreground"><ChevronRight className="w-3 h-3 rotate-180" /> {picked.label}</button>
          <button onClick={() => { onApply(picked.id, ''); onClose(); }} className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">All {picked.label}{!activeFilters[picked.id] && <Check className="w-3.5 h-3.5 text-primary" />}</button>
          {valuesFor(picked).map(v => (
            <button key={v} onClick={() => { onApply(picked.id, v); onClose(); }} className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">{v}{activeFilters[picked.id] === v && <Check className="w-3.5 h-3.5 text-primary" />}</button>
          ))}
        </>
      )}
    </Menu>
  );
}

function GroupMenu({ fields, groupBy, onApply, onClear, onClose }) {
  const { personLabel } = useConflictScope();
  return (
    <Menu open onClose={onClose}>
      <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group by</div>
      {groupableFields(fields, personLabel).map(f => (
        <button key={f.id} onClick={() => { onApply(f.id); onClose(); }} className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted/50 text-left">{f.label}{groupBy === f.id && <Check className="w-3.5 h-3.5 text-primary" />}</button>
      ))}
      {groupBy && (
        <>
          <div className="my-1 border-t border-border" />
          <button onClick={() => { onClear(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-destructive hover:bg-muted/50 text-left"><X className="w-3.5 h-3.5" /> Clear Group</button>
        </>
      )}
    </Menu>
  );
}

function ExportMenu({ onClose, onExcel, onPdf }) {
  return (
    <Menu open onClose={onClose}>
      <button onClick={() => { onExcel(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap"><FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel</button>
      <button onClick={() => { onPdf(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap"><FileText className="w-4 h-4 text-red-600" /> Export to PDF</button>
    </Menu>
  );
}

// Resolve a scope selection ('all' | 'Open' | 'Closed') against the full conflict list.
// Records saved without a status read as Open, matching the register's tabs.
function scopedConflicts(allConflicts, scope) {
  if (scope === 'all') return allConflicts;
  return allConflicts.filter((c) => (c.status || 'Open') === scope);
}

export default function ConflictToolbar({
  fields, conflicts, activeFilters, onApplyFilter, onClearFilter,
  groupBy, onApplyGroup, onClearGroup, sort, onApplySort, onClearSort, allConflicts, selectedConflicts, tableColumns, title,
}) {
  const { personLabel } = useConflictScope();
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [exportModal, setExportModal] = useState(null); // 'pdf' | 'excel' | null
  const filterCount = Object.keys(activeFilters).length;

  const handleExport = async (scope) => {
    const data = scope === 'selected' ? selectedConflicts : scopedConflicts(allConflicts, scope);
    if (exportModal === 'excel') {
      await exportToExcel(data, tableColumns, title, personLabel);
    } else {
      exportToPdf(data, tableColumns, title);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <ToolbarButton
          icon={LayoutGrid}
          label="Group"
          active={!!groupBy}
          onClick={() => { setGroupOpen(o => !o); setFilterOpen(false); setExportOpen(false); setSortOpen(false); }} />
        {groupOpen && <GroupMenu fields={fields} groupBy={groupBy} onApply={onApplyGroup} onClear={onClearGroup} onClose={() => setGroupOpen(false)} />}
      </div>
      <div className="relative">
        <ToolbarButton
          icon={ArrowUpDown}
          label="Sort"
          active={!!sort}
          onClick={() => { setSortOpen(o => !o); setGroupOpen(false); setFilterOpen(false); setExportOpen(false); }} />
        {sortOpen && <AssetSortMenu sort={sort} sortFields={SORT_FIELDS} onApply={onApplySort} onClear={onClearSort} onClose={() => setSortOpen(false)} />}
      </div>
      <div className="relative">
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => { setFilterOpen(o => !o); setGroupOpen(false); setExportOpen(false); }} />
        {filterOpen && <FilterMenu fields={fields} conflicts={conflicts} activeFilters={activeFilters} onApply={onApplyFilter} onClear={onClearFilter} onClose={() => setFilterOpen(false)} />}
      </div>
      <div className="relative">
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={() => { setExportOpen(o => !o); setFilterOpen(false); setGroupOpen(false); }} />
        {exportOpen && <ExportMenu onClose={() => setExportOpen(false)} onExcel={() => setExportModal('excel')} onPdf={() => setExportModal('pdf')} />}
      </div>

      <ExportConflictModal
        isOpen={!!exportModal}
        type={exportModal}
        selectedCount={selectedConflicts ? selectedConflicts.length : null}
        onConfirm={handleExport}
        onClose={() => setExportModal(null)}
      />
    </div>
  );
}