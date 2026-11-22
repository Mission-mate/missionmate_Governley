import React, { useState, useRef, useEffect } from 'react';
import { ListFilter, ChevronRight, Check, Download, FileSpreadsheet, FileText } from 'lucide-react';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';
import ExportSubmissionsDialog from './ExportSubmissionsDialog';
import { exportSubmissionsExcel, exportSubmissionsPdf } from '@/lib/submissionsExport';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function Menu({ onClose, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);
  return (
    <div ref={ref} className="animate-dropdown-enter absolute top-full right-0 mt-1.5 z-50 min-w-[220px] bg-white border border-border rounded-lg shadow-lg py-1.5">
      {children}
    </div>
  );
}

export default function SubmissionsToolbar({ submissions = [], filtered = [], selected = [], activeFilters, onApplyFilter, onClearFilters }) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [picked, setPicked] = useState(null);
  const [exportDialog, setExportDialog] = useState(null); // 'pdf' | 'excel'

  const plans = [...new Set(submissions.map((s) => s.membership_structure_name).filter(Boolean))];
  const years = [...new Set(submissions.map((s) => {
    const d = new Date(s.submitted_at || s.created_date);
    return isNaN(d) ? null : String(d.getFullYear());
  }).filter(Boolean))].sort().reverse();

  const FIELDS = [
    { id: 'plan', label: 'Membership Plan', values: plans },
    { id: 'year', label: 'Year Submitted', values: years },
    { id: 'month', label: 'Month Submitted', values: MONTHS },
  ];

  const filterCount = Object.values(activeFilters).filter(Boolean).length;

  const handleExport = (scope) => {
    const rows = scope === 'selected' ? selected : filtered;
    if (exportDialog === 'pdf') exportSubmissionsPdf(rows);
    else exportSubmissionsExcel(rows);
    setExportDialog(null);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => { setExportOpen(false); setPicked(null); setFilterOpen((o) => !o); }}
        />
        {filterOpen && (
          <Menu onClose={() => setFilterOpen(false)}>
            {!picked ? (
              <>
                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
                {FIELDS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setPicked(f)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left"
                  >
                    <span className="flex items-center gap-2">
                      {f.label}
                      {activeFilters[f.id] && <span className="text-[11px] font-semibold text-primary bg-primary/10 rounded-full px-1.5 py-0.5 leading-none">1</span>}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                  </button>
                ))}
                <FilterFooter onClear={() => { onClearFilters(); setFilterOpen(false); }} onApply={() => setFilterOpen(false)} count={filterCount} />
              </>
            ) : (
              <>
                <button onClick={() => setPicked(null)} className="w-full flex items-center gap-1 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground text-left border-b border-border">
                  <ChevronRight className="w-3 h-3 rotate-180" /> {picked.label}
                </button>
                <div className="py-1 max-h-64 overflow-y-auto">
                  <button onClick={() => onApplyFilter(picked.id, '')} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                    All {picked.label}
                    {!activeFilters[picked.id] && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>
                  {picked.values.map((v) => (
                    <button key={v} onClick={() => onApplyFilter(picked.id, v)} className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted/50 text-left">
                      {v}
                      {activeFilters[picked.id] === v && <Check className="w-3.5 h-3.5 text-primary" />}
                    </button>
                  ))}
                </div>
                <FilterFooter onClear={() => onApplyFilter(picked.id, '')} onApply={() => setFilterOpen(false)} />
              </>
            )}
          </Menu>
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={() => { setFilterOpen(false); setExportOpen((o) => !o); }}
        />
        {exportOpen && (
          <Menu onClose={() => setExportOpen(false)}>
            <button onClick={() => { setExportDialog('excel'); setExportOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
            </button>
            <button onClick={() => { setExportDialog('pdf'); setExportOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
              <FileText className="w-4 h-4 text-red-600" /> Export to PDF
            </button>
          </Menu>
        )}
      </div>

      <ExportSubmissionsDialog
        isOpen={!!exportDialog}
        format={exportDialog || 'pdf'}
        selectedCount={selected.length}
        onClose={() => setExportDialog(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}