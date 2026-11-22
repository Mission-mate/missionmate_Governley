import React from 'react';
import { ChevronRight, Trash2 } from 'lucide-react';
import RowNotesButton from './RowNotesButton';
import { cn } from '@/lib/utils';
import { DisplayCell, ROW_ACTION_REVEAL } from './ReportRow';

/**
 * Calculated summary (parent) row — light grey background, read-only numeric
 * fields rolled up from its child rows, with an expand/collapse control.
 */
function ParentReportRowInner({ node, columns, expanded, onToggle, onDelete, onOpenNotes, hasNotes = false, readOnly = false, grip = null, unit = '#', direction }) {
  return (
    <tr className="group border-b border-border last:border-b-0 bg-muted/50">
      <td className="px-4 py-3 text-sm font-bold text-foreground whitespace-nowrap">
        <span className="inline-flex items-center gap-1.5">
          {grip}
          <button onClick={onToggle} className="p-0.5 text-muted-foreground hover:text-foreground rounded transition-colors">
            <ChevronRight className={cn('w-4 h-4 transition-transform', expanded && 'rotate-90')} />
          </button>
          {node.label}
          <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide ml-1">
            {node.children.length} {node.childNoun}
          </span>
        </span>
      </td>
      {columns.map((col) => (
        <td key={col.kind === 'custom' ? col.id : col.key} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
          {col.kind === 'custom'
            ? <span className="text-muted-foreground">—</span>
            : <DisplayCell col={col} row={node.display} unit={unit} direction={direction} />}
        </td>
      ))}
      {!readOnly && <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center justify-end gap-1">
          {hasNotes && node.row && (
            <RowNotesButton onClick={() => onOpenNotes?.(node.row)} />
          )}
          <button onClick={onDelete} title="Delete" aria-label="Delete" className={cn(ROW_ACTION_REVEAL, 'p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted')}>
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>}
    </tr>
  );
}

const ParentReportRow = React.memo(ParentReportRowInner);
export default ParentReportRow;