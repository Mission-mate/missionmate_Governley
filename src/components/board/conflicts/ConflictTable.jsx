import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import { cn } from '@/lib/utils';
import { conflictColumnPercents } from '@/lib/conflictColumns';
import { useConflictScope } from '@/lib/conflictScope';
import ConflictLeadCell, { LEAD_LABELS } from './ConflictLeadCell';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide';

/** One bordered table wrap — used standalone or once per group. */
export default function ConflictTable({ items, columns, selectedIds, onToggle, onRowClick, renderCell }) {
  const { registerId, declarant } = useConflictScope();
  // Compliance: the main register leads with Declarant + Conflict; a declarant's profile with Conflict only.
  const lead = !registerId ? ['details'] : declarant ? ['conflict'] : ['declarant', 'conflict'];
  // Fixed proportional widths shared with the PDF export.
  const pct = conflictColumnPercents([...lead, ...columns.map((c) => c.id)]);
  const widthOf = (id) => ({ width: `${pct[id].toFixed(4)}%` });

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5 w-10" />
            {lead.map((id) => <th key={id} style={widthOf(id)} className={HEAD}>{LEAD_LABELS[id]}</th>)}
            {columns.map((col) => <th key={col.id} style={widthOf(col.id)} className={HEAD}>{col.label}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((c) => {
            const selected = selectedIds.includes(c.id);
            return (
              <tr
                key={c.id}
                onClick={() => onRowClick(c)}
                className={cn('hover:bg-sidebar-accent/70 transition-colors cursor-pointer', selected && 'bg-primary/5 hover:bg-primary/5')}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <CircleCheck checked={selected} onChange={() => onToggle(c.id)} />
                </td>
                {lead.map((id) => (
                  <td key={id} className="px-4 py-3" style={widthOf(id)}><ConflictLeadCell id={id} conflict={c} /></td>
                ))}
                {columns.map((col) => (
                  <td key={col.id} style={widthOf(col.id)} className="px-4 py-3 text-sm text-muted-foreground">
                    {renderCell(col, c)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}