import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, ListFilter, ChevronRight, Check, X, Download, FileSpreadsheet, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { exportToExcel, exportToPdf } from '@/lib/meetingActionExport';
import ExportActionsDialog from '@/components/board/meeting-actions/ExportActionsDialog';
import FilterFooter from '@/components/shared/filter/FilterFooter';
import SortButton from '@/components/shared/SortButton';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import FilterCountBadge from '@/components/shared/table/FilterCountBadge';

/** Fields offered for grouping and filtering, and for sorting, unless a register passes its own. */
const ACTION_FACET_IDS = ['status', 'priority'];
const ACTION_SORT_FIELDS = [{ key: 'due_date', label: 'Due Date' }];
const facetFields = (fields, ids) => fields.filter(f => ids.includes(f.id));

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

/** Filter dropdown: pick a field, then a value. Uses the default app Clear/Apply footer. */
function FilterMenu({ fields, facetIds, actions, activeFilters, onApply, onClear, onClose }) {
  const [pickedField, setPickedField] = useState(null);

  const valuesFor = (field) => {
    if (field.id === 'status') return ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
    const cfgOpts = field.config?.options;
    if (cfgOpts?.length) return cfgOpts.map(o => (typeof o === 'object' ? o.name : o));
    // derive from data
    const key = field.id;
    const vals = new Set();
    actions.forEach(a => {
      const v = ['meeting_name', 'meeting_committee', 'meeting_date', 'minute_ref', 'raised_by', 'assigned_to', 'due_date', 'priority', 'status'].includes(key)
        ? a[key] : a.custom_fields?.[key];
      if (v) vals.add(v);
    });
    return [...vals];
  };

  const activeCount = Object.keys(activeFilters).length;

  return (
    <Menu open onClose={onClose}>
      {!pickedField ? (
        <>
          <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Filter by</div>
          {facetFields(fields, facetIds).map(f => (
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
            {valuesFor(pickedField).map(v => (
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

function GroupMenu({ fields, facetIds, groupBy, onApply, onClear, onClose }) {
  return (
    <Menu open onClose={onClose}>
      <div className="px-3 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Group by</div>
      {facetFields(fields, facetIds).map(f => (
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

function ExportMenu({ open, onClose, onExcel, onPdf }) {
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

// Filter an action list down to a selected register-status scope for export.
// scope: 'all' | 'active' | 'completed'
function scopeActions(actions, scope) {
  if (scope === 'all') return actions;
  return actions.filter((a) => (a.register_status || 'active') === scope);
}

export default function ActionRegisterToolbar({
  fields, actions, activeFilters, onApplyFilter, onClearFilter,
  groupBy, onApplyGroup, onClearGroup,
  sort, onChangeSort,
  tableColumns, registerTitle,
  // Other registers reuse this toolbar with their own facets, sort fields and export.
  facetIds = ACTION_FACET_IDS, sortFields = ACTION_SORT_FIELDS, onExport, exportDialogProps,
}) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [groupOpen, setGroupOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportDialog, setExportDialog] = useState(null); // 'pdf' | 'excel' | null
  const filterCount = Object.keys(activeFilters).length;

  const handleExport = (scope) => {
    if (onExport) {
      onExport(exportDialog, scope);
    } else {
      const scoped = scopeActions(actions, scope);
      if (exportDialog === 'pdf') exportToPdf(scoped, tableColumns, registerTitle);
      else exportToExcel(scoped, fields, registerTitle);
    }
    setExportDialog(null);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <ToolbarButton
          icon={LayoutGrid}
          label="Group"
          active={!!groupBy}
          onClick={() => { setGroupOpen(o => !o); setFilterOpen(false); }}
        />
        {groupOpen && (
          <GroupMenu fields={fields} facetIds={facetIds} groupBy={groupBy} onApply={onApplyGroup} onClear={onClearGroup} onClose={() => setGroupOpen(false)} />
        )}
      </div>

      <div className="relative">
        <ToolbarButton
          icon={ListFilter}
          label="Filter"
          active={!!filterCount}
          badge={<FilterCountBadge count={filterCount} />}
          onClick={() => { setFilterOpen(o => !o); setGroupOpen(false); }}
        />
        {filterOpen && (
          <FilterMenu
            fields={fields} facetIds={facetIds} actions={actions} activeFilters={activeFilters}
            onApply={onApplyFilter} onClear={onClearFilter} onClose={() => setFilterOpen(false)}
          />
        )}
      </div>

      <SortButton
        fields={sortFields}
        value={sort}
        onChange={onChangeSort}
      />

      <div className="relative">
        <ToolbarButton
          icon={Download}
          label="Export"
          onClick={() => { setExportOpen(o => !o); setFilterOpen(false); setGroupOpen(false); }}
        />
        {exportOpen && (
          <ExportMenu
            onClose={() => setExportOpen(false)}
            onExcel={() => setExportDialog('excel')}
            onPdf={() => setExportDialog('pdf')}
          />
        )}
      </div>

      <ExportActionsDialog
        isOpen={!!exportDialog}
        format={exportDialog || 'pdf'}
        onClose={() => setExportDialog(null)}
        onConfirm={handleExport}
        {...exportDialogProps}
      />
    </div>
  );
}