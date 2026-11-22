import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonCell from '@/components/board/meeting-actions/PersonCell';
import { StatusBadge, PriorityBadge, CustomFieldCell } from '@/components/board/meeting-actions/ActionCells';
import { isOverdue, formatDate, meetingMeta } from '@/lib/meetingActionApi';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import ErrorRowFallback from '@/components/shared/states/ErrorRowFallback';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';

function ActionRow({ action, columns, selected, onToggle, onRowClick }) {
  const overdue = isOverdue(action.due_date, action.status, action.register_status);
  return (
    <ErrorBoundary
      resetKey={action.id}
      fallback={({ retry }) => (
        <ErrorRowFallback
          colSpan={columns.length + 2}
          onRetry={retry}
          leading={<CircleCheck checked={selected} onChange={() => onToggle(action.id)} />}
        />
      )}>
      <tr
        onClick={() => onRowClick(action)}
        className={cn('hover:bg-sidebar-accent/70 transition-colors cursor-pointer', selected && 'bg-primary/10 hover:bg-primary/10')}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <CircleCheck checked={selected} onChange={() => onToggle(action.id)} />
        </td>
        <td className="px-4 py-3">
          <p className={cn('text-sm font-medium truncate', action.title ? 'text-foreground' : 'text-muted-foreground italic')} title={action.title}>{action.title || 'Untitled action'}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {[action.action_id && `ID: ${action.action_id}`, meetingMeta(action)].filter(Boolean).join(' · ')}
          </p>
        </td>
        {columns.map((col) => {
          if (col.id === 'assigned_to') return (
            <td key={col.id} className="px-4 py-3 whitespace-nowrap"><PersonCell name={action.assigned_to} /></td>);


          if (col.id === 'due_date') return (
            <td key={col.id} className="px-4 py-3 whitespace-nowrap">
              {action.due_date ? (
                <div>
                  <span className={cn('text-sm', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
                    {formatDate(action.due_date)}
                  </span>
                  {overdue && <span className="block text-xs text-destructive">{overdueLabel(action.due_date)}</span>}
                </div>
              ) : <span className="text-muted-foreground/50 text-sm">—</span>}
            </td>);

          if (col.id === 'priority') return (
            <td key={col.id} className="px-4 py-3"><PriorityBadge priority={action.priority} /></td>);

          if (col.id === 'status') return (
            <td key={col.id} className="px-4 py-3"><StatusBadge status={action.status || 'Not Started'} /></td>);

          return (
            <td key={col.id} className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
              <CustomFieldCell field={col} rawVal={action.custom_fields?.[col.id] || ''} />
            </td>);
        })}
      </tr>
    </ErrorBoundary>
  );
}

/**
 * Pass `items` for a flat table, or `groups` ([{ key, label, items }]) to render
 * every group inside ONE table — a single header row plus full-width separator
 * rows — so all groups share the same column grid.
 */
// Fixed width per non-Action column; the Action column takes whatever remains.
// Priority gives 25% of its share to Assigned To.
const COL_SHARE = 12;
const COL_WIDTHS = { priority: 9, assigned_to: 15 };
const colWidth = (col) => COL_WIDTHS[col.id] ?? COL_SHARE;

// Due Date sits directly after Action; Status is always the last column.
// Raised By is shown in the pane/modal only, not in the table.
// Assigned To always sits immediately before Priority.
const orderColumns = (cols) => {
  const middle = cols.filter((c) => !['due_date', 'status', 'raised_by', 'assigned_to'].includes(c.id));
  const assigned = cols.filter((c) => c.id === 'assigned_to');
  const pIdx = middle.findIndex((c) => c.id === 'priority');
  if (pIdx === -1) middle.unshift(...assigned);
  else middle.splice(pIdx, 0, ...assigned);
  return [
    ...cols.filter((c) => c.id === 'due_date'),
    ...middle,
    ...cols.filter((c) => c.id === 'status'),
  ];
};

export default function ActionTable({ items, groups, columns: rawColumns, selectedIds, onToggle, onRowClick }) {
  const columns = orderColumns(rawColumns);

  const renderRow = (action) => (
    <ActionRow
      key={action.id}
      action={action}
      columns={columns}
      selected={selectedIds.includes(action.id)}
      onToggle={onToggle}
      onRowClick={onRowClick}
    />
  );

  const renderTable = (rows) => {
    return (
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: '4%' }} />
          <col style={{ width: `${96 - columns.reduce((sum, col) => sum + colWidth(col), 0)}%` }} />
          {columns.map((col) => <col key={col.id} style={{ width: `${colWidth(col)}%` }} />)}
        </colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5" />
            <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Action</th>
            {columns.map((col) => <th key={col.id} className="text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">{col.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{rows.map(renderRow)}</tbody>
      </table>
    );
  };

  return groups ? (
    <div className="space-y-4">
      {groups.map((section) => (
        <GroupedTableBlock key={section.key} label={section.label} count={section.items.length}>
          {renderTable(section.items)}
        </GroupedTableBlock>
      ))}
    </div>
  ) : (
    <div className="border border-border rounded-xl overflow-hidden">
      {renderTable(items || [])}
    </div>
  );
}