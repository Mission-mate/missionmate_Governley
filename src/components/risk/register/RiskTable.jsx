import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PlainHeader from '@/components/shared/table/PlainHeader';
import RiskGroupBlock from './RiskGroupBlock';
import { cn } from '@/lib/utils';
import { RISK_TABLE, registerRowClass } from '@/components/risk/riskSurfaces';

/**
 * One bordered risk table wrap. Pass `items` for a flat table, or `groups`
 * ([{ key, label, items }]) to render every group inside this single table so
 * all groups share the one header's column widths.
 */
export default function RiskTable({ items, groups, columns, selectedIds, onToggle, onRowClick, renderCell }) {
  const sections = groups || [{ key: '__all__', label: null, items: items || [] }];
  const colSpan = 1 + columns.length;

  const renderTable = (rows) => (
    <table className="w-full table-fixed">
      <colgroup><col style={{ width: 44 }} />{columns.map((col) => <col key={col.id} style={{ width: col.width }} />)}</colgroup>
      <thead><tr className="bg-secondary/40 border-b border-border">
        <th className="px-3 py-2.5" aria-label="Select" />
        {columns.map((col) => <PlainHeader key={col.id} tooltip={col.tooltip}>{col.label}</PlainHeader>)}
      </tr></thead>
      <tbody className="divide-y divide-border">
        {rows.map((risk) => { const selected = selectedIds.includes(risk.id); return (
          <tr key={risk.id} onClick={() => onRowClick(risk)} className={registerRowClass(selected)}>
            <td className="px-3 py-3 align-middle" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selected} onChange={() => onToggle(risk.id)} /></td>
            {columns.map((col) => <td key={col.id} className={cn('px-3 py-3 overflow-hidden', col.valign === 'middle' ? 'align-middle' : 'align-top')}><div className="min-w-0">{renderCell(risk, col)}</div></td>)}
          </tr>
        ); })}
      </tbody>
    </table>
  );

  // A single section with no label is the un-grouped case — render a plain
  // bordered table so no orphaned group header / count pill appears.
  const isGrouped = sections.length > 1 || sections[0]?.label !== null;

  return isGrouped ? (
    <div className="space-y-4">
      {sections.map((section) => <RiskGroupBlock key={section.key} label={section.label} count={section.items.length}>{renderTable(section.items)}</RiskGroupBlock>)}
    </div>
  ) : (
    <div className={cn(RISK_TABLE, 'overflow-hidden')}>{renderTable(sections[0].items)}</div>
  );
}