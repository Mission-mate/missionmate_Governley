import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import ErrorBoundary from '@/components/shared/states/ErrorBoundary';
import ErrorRowFallback from '@/components/shared/states/ErrorRowFallback';
import GroupedTableBlock from '@/components/shared/table/GroupedTableBlock';
import { OutcomeBadge, DecisionStatusBadge } from '@/components/board/decisions/DecisionBadges';
import { formatDate } from '@/lib/meetingActionApi';
import { decisionStatus, decisionMeta } from '@/lib/decisions';
import { cn } from '@/lib/utils';

// Column widths in percent; the Decision column takes whatever remains.
const COLUMNS = [
  { id: 'decision_type', label: 'Type', width: 12 },
  { id: 'outcome', label: 'Outcome', width: 12 },
  { id: 'decision_date', label: 'Decision Date', width: 14 },
  { id: 'status', label: 'Status', width: 12 },
];
const SELECT_WIDTH = 4;
const TITLE_WIDTH = 100 - SELECT_WIDTH - COLUMNS.reduce((sum, col) => sum + col.width, 0);
const HEAD_CELL = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';
const EMPTY = <span className="text-sm text-muted-foreground/50">—</span>;

function DecisionRow({ decision, selected, onToggle, onRowClick }) {
  const meta = decisionMeta(decision);
  return (
    <ErrorBoundary
      resetKey={decision.id}
      fallback={({ retry }) => (
        <ErrorRowFallback
          colSpan={COLUMNS.length + 2}
          onRetry={retry}
          leading={<CircleCheck checked={selected} onChange={() => onToggle(decision.id)} />}
        />
      )}>
      <tr
        onClick={() => onRowClick(decision)}
        className={cn('hover:bg-sidebar-accent/70 transition-colors cursor-pointer', selected && 'bg-primary/10 hover:bg-primary/10')}
      >
        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
          <CircleCheck checked={selected} onChange={() => onToggle(decision.id)} />
        </td>
        <td className="px-4 py-3">
          <p className="text-sm font-medium text-foreground truncate" title={decision.title}>{decision.title}</p>
          {meta && <p className="text-xs text-muted-foreground mt-0.5 truncate">{meta}</p>}
        </td>
        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">{decision.decision_type || EMPTY}</td>
        <td className="px-4 py-3"><OutcomeBadge outcome={decision.outcome} /></td>
        <td className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
          {decision.decision_date ? formatDate(decision.decision_date) : EMPTY}
        </td>
        <td className="px-4 py-3"><DecisionStatusBadge status={decisionStatus(decision)} /></td>
      </tr>
    </ErrorBoundary>
  );
}

/**
 * Pass `items` for a flat table, or `groups` ([{ key, label, items }]) to render
 * one table per group with the same column grid.
 */
export default function DecisionTable({ items, groups, selectedIds, onToggle, onRowClick }) {
  const renderTable = (rows) => (
    <table className="w-full table-fixed">
      <colgroup>
        <col style={{ width: `${SELECT_WIDTH}%` }} />
        <col style={{ width: `${TITLE_WIDTH}%` }} />
        {COLUMNS.map((col) => <col key={col.id} style={{ width: `${col.width}%` }} />)}
      </colgroup>
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="px-4 py-2.5" />
          <th className={HEAD_CELL}>Decision</th>
          {COLUMNS.map((col) => <th key={col.id} className={HEAD_CELL}>{col.label}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {rows.map((decision) => (
          <DecisionRow
            key={decision.id}
            decision={decision}
            selected={selectedIds.includes(decision.id)}
            onToggle={onToggle}
            onRowClick={onRowClick}
          />
        ))}
      </tbody>
    </table>
  );

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