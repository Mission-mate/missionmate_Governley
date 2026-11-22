import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PlainHeader from '@/components/shared/table/PlainHeader';
import { cn } from '@/lib/utils';
import { RISK_TABLE, registerRowClass } from '@/components/risk/riskSurfaces';

/** One bordered sub-row table (actions / controls) — used standalone or once per group. */
export default function RowTable({ items, columns, selectedKeys, onToggle, onRowClick, renderCell }) {

  return (
    <div className={cn(RISK_TABLE, 'overflow-hidden')}>
      <table className="w-full table-fixed">
        <colgroup>
          <col style={{ width: 44 }} />
          {columns.map((col) => <col key={col.id} style={{ width: col.width }} />)}
        </colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-3 py-2.5" aria-label="Select" />
            {columns.map((col) => (
              <PlainHeader key={col.id} tooltip={col.tooltip}>{col.label}</PlainHeader>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((row) => {
            const selected = selectedKeys.includes(row._key);
            return (
              <tr
                key={row._key}
                onClick={() => onRowClick?.(row)}
                className={registerRowClass(selected)}
              >
                <td className="px-3 py-3 align-middle" onClick={(e) => e.stopPropagation()}>
                  <CircleCheck checked={selected} onChange={() => onToggle(row._key)} />
                </td>
                {columns.map((col) => (
                  <td key={col.id} className="px-3 py-3 align-top overflow-hidden">
                    <div className="min-w-0">{renderCell(row, col.id)}</div>
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