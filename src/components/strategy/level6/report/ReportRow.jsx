import React from 'react';
import { Pencil, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import RowNotesButton from './RowNotesButton';
import { cn } from '@/lib/utils';
import { CustomCellDisplay } from './ReportCellEditor';

const Dash = () => <span className="text-muted-foreground">—</span>;

/** Formats a stored raw number for display using the deliverable's unit of measure. */
export function formatMeasure(value, unit) {
  if (value === null || value === undefined || value === '') return null;
  if (unit === '$') return `$${value}`;
  if (unit === '%') return `${value}%`;
  return String(value);
}

function Measure({ value, unit }) {
  const text = formatMeasure(value, unit);
  return text === null ? <Dash /> : <>{text}</>;
}

function SignedValue({ value, unit, direction = 'Higher is Better' }) {
  if (value === null || value === undefined) return <Dash />;
  if (value === 0) {
    return <span className="font-medium text-amber-600">{formatMeasure(0, unit)}</span>;
  }
  const positive = value > 0;
  const Arrow = positive ? ArrowUp : ArrowDown;
  // Arrow direction always follows the sign; colour follows the desired direction.
  const good = direction === 'Lower is Better' ? !positive : positive;
  return (
    <span className={cn('inline-flex items-center gap-0.5 font-medium', good ? 'text-green-600' : 'text-red-600')}>
      <Arrow className="w-3.5 h-3.5" />{formatMeasure(Math.abs(value), unit)}
    </span>
  );
}

/** Read-only cell renderer shared by data rows and parent summary rows. */
export function DisplayCell({ col, row, unit = '#', direction }) {
  switch (col.kind === 'custom' ? 'custom' : col.key) {
    case 'expected': return <Measure value={row.expected} unit={unit} />;
    case 'actual': return <Measure value={row.actual} unit={unit} />;
    case 'variance': return <SignedValue value={row._variance ?? null} unit={unit} direction={direction} />;
    case 'ytd': return <Measure value={row._ytd} unit={unit} />;
    case 'expected_ytd': return <Measure value={row._expected_ytd} unit={unit} />;
    case 'total_expected': return <Measure value={row.total_expected} unit={unit} />;
    case 'baseline': return <Measure value={row.baseline} unit={unit} />;
    // Ratios are always percentages regardless of the unit of measure.
    case 'progress_pct': return row._progress_pct != null ? `${row._progress_pct}%` : <Dash />;
    case 'variance_pct': return <SignedValue value={row._variance_pct ?? null} unit="%" direction={direction} />;
    case 'custom': return <CustomCellDisplay column={col} value={row.custom_values?.[col.id]} />;
    default: return <Dash />;
  }
}

/** One read-only row of the Level 6 reporting data table — edit opens the right pane. */
/** Row action buttons stay hidden until their row is hovered or the button is keyboard-focused. */
export const ROW_ACTION_REVEAL = 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity';

function ReportRowInner({ row, columns, onEdit, onView, onDelete, onOpenNotes, hasNotes = false, label, indent = false, showDelete = true, readOnly = false, grip = null, unit = '#', direction, className }) {
  const displayLabel = label ?? row.period_label;
  const canOpen = !readOnly && !!onView;
  const stop = (e) => e.stopPropagation();

  return (
    <tr
      onClick={canOpen ? onView : undefined}
      className={cn('group border-b border-border last:border-b-0 transition-colors', className, canOpen && 'cursor-pointer hover:bg-sidebar-accent/70')}>
      <td className={cn('px-4 py-3 text-sm text-foreground whitespace-nowrap', indent ? 'pl-11 font-medium' : 'font-bold')}>
        <span className="inline-flex items-center gap-1.5">{grip && <span onClick={stop}>{grip}</span>}{displayLabel}</span>
      </td>
      {columns.map((col) => (
        <td key={col.kind === 'custom' ? col.id : col.key} className="px-4 py-3 text-sm text-foreground whitespace-nowrap">
          <DisplayCell col={col} row={row} unit={unit} direction={direction} />
        </td>
      ))}
      {!readOnly && <td className="px-4 py-3 whitespace-nowrap" onClick={stop}>
        <div className="flex items-center justify-end gap-1">
          {hasNotes && (
            <RowNotesButton onClick={() => onOpenNotes?.(row)} />
          )}
          <button onClick={() => onEdit(row)} title="Edit" aria-label="Edit" className={cn(ROW_ACTION_REVEAL, 'p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted')}><Pencil className="w-4 h-4" /></button>
          {showDelete && (
            <button onClick={() => onDelete(row)} title="Delete" aria-label="Delete" className={cn(ROW_ACTION_REVEAL, 'p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-muted')}><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      </td>}
    </tr>
  );
}

const ReportRow = React.memo(ReportRowInner);
export default ReportRow;