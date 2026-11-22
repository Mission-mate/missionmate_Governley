import React from 'react';
import RiskTable from '@/components/risk/register/RiskTable';
import { columnWidth } from '@/lib/whsTabs';
import WhsCell from './WhsCell';

/** WHS register table — the Risk Register table with WHS columns and cells. */
export default function WhsTable({ columns, groups, selectedIds, onToggle, onOpen }) {
  const cols = columns.map((c) => ({ ...c, id: c.key, width: columnWidth(c), valign: 'middle' }));
  return (
    <RiskTable groups={groups} columns={cols} selectedIds={selectedIds} onToggle={onToggle}
      onRowClick={onOpen} renderCell={(row, col) => <WhsCell col={col} row={row} />} />
  );
}