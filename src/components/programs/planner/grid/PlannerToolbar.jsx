import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOOLBAR_SEARCH_INPUT } from '@/components/shared/table/ToolbarButton';
import TaskToolbar from '@/components/strategy/level5/tasks/TaskToolbar';
import ExportScopeDialog from '@/components/shared/export/ExportScopeDialog';
import { exportTasksToPdf, exportTasksToExcel } from '@/lib/tasks/taskExport';

/** Search + Group / Filter / Sort / Export for the planner, shared by List and Board. */
export default function PlannerToolbar({ title = 'Planner', view, setView, records, fields, viewColumns, statusColumn, selectedId }) {
  const [format, setFormat] = useState(null);
  const set = (patch) => setView((v) => ({ ...v, ...patch }));
  const statusOptions = (statusColumn?.config?.options || []).map((o) => o.name);

  const runExport = (scope) => {
    let rows = records;
    let label = 'All Tasks';
    if (scope === 'selected') { rows = records.filter((r) => r.id === selectedId); label = 'Selected Tasks'; }
    else if (Array.isArray(scope)) { rows = records.filter((r) => scope.includes(r.custom_values[statusColumn.id])); label = scope.join(', '); }
    if (format === 'excel') exportTasksToExcel(rows, viewColumns, title);
    else exportTasksToPdf(rows, viewColumns, title, label);
    setFormat(null);
  };

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={view.search} onChange={(e) => set({ search: e.target.value })} placeholder="Search tasks..."
          className={cn(TOOLBAR_SEARCH_INPUT, 'w-48 shadow-sm bg-card text-foreground placeholder:text-muted-foreground')} />
      </div>
      <TaskToolbar tasks={records} columns={fields} filters={view.filters}
        onFilter={(id, v) => set({ filters: { ...view.filters, [id]: v } })} onClearFilters={() => set({ filters: {} })}
        groupBy={view.groupBy} onGroup={(id) => set({ groupBy: id })} onClearGroup={() => set({ groupBy: '' })}
        sort={view.sort} onSort={(sort) => set({ sort })} onExport={setFormat} />
      <ExportScopeDialog isOpen={!!format} format={format === 'excel' ? 'excel' : 'pdf'} itemLabel="tasks"
        allLabel="All Tasks" selectedLabel="Selected Tasks" selectedCount={selectedId ? 1 : 0} options={statusOptions}
        onClose={() => setFormat(null)} onConfirm={runExport} />
    </div>
  );
}