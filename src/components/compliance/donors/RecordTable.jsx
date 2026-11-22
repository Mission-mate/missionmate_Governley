import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { cn } from '@/lib/utils';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import StrategyCustomCell from '@/components/strategy/customFields/StrategyCustomCell';
import { DEFAULT_COLUMN_WIDTH } from '@/lib/registerColumnTypes';
import { displayValue } from '@/lib/donorRegister';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide truncate';
const BASE_PX = 1200;

const Identity = ({ name, code, email }) => (
  <div className="flex items-center gap-3 min-w-0">
    <PersonInitialsAvatar name={name} />
    <div className="min-w-0">
      <p className="font-medium truncate">{name || '—'}</p>
      {(code || email) && <p className="text-xs text-muted-foreground truncate">{[code, email].filter(Boolean).join(' · ')}</p>}
    </div>
  </div>
);

/** Selectable donor / donation table with full-row click and custom columns. */
export default function RecordTable({ fields, items, selectedIds, onToggle, onOpen, emptyText, customColumns, donorName }) {
  const hasCustom = customColumns.length > 0;
  return (
    <div className={hasCustom ? 'overflow-x-auto' : ''}>
      <table className="w-full table-fixed" style={hasCustom ? { minWidth: BASE_PX + customColumns.length * DEFAULT_COLUMN_WIDTH } : undefined}>
        <colgroup>
          <col style={{ width: '56px' }} />{fields.map((f) => <col key={f.k} style={f.k === 'donor_name' || f.k === 'donor_id' ? { width: '22%' } : undefined} />)}
          {customColumns.map((c) => <col key={c.id} style={{ width: `${DEFAULT_COLUMN_WIDTH}px` }} />)}
        </colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5" />
            {fields.map((f) => <th key={f.k} className={HEAD}>{f.tableLabel || f.label.replace(' *', '')}</th>)}
            {customColumns.map((c) => <th key={c.id} className={HEAD}>{c.title}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr><td colSpan={fields.length + 1 + customColumns.length} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
          ) : items.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r)} className={cn('cursor-pointer transition-colors', selectedIds.has(r.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selectedIds.has(r.id)} onChange={() => onToggle(r.id)} /></td>
              {fields.map((f) => (
                <td key={f.k} className="px-4 py-3 text-sm text-foreground truncate">
                  {f.k === 'donor_name' ? <Identity name={r.donor_name} code={r.donor_code} email={r.email} />
                    : f.k === 'donor_id' ? <Identity name={donorName(r.donor_id)} code={`Donation Ref. ${r.donation_code || '—'}`} />
                    : f.type === 'select' ? <AssetBadge value={f.k === 'status' ? r.status || 'Active' : r[f.k]} options={f.options} />
                    : <span>{displayValue(f, r[f.k], donorName) || <span className="text-muted-foreground">—</span>}</span>}
                </td>
              ))}
              {customColumns.map((c) => (
                <td key={c.id} className="px-4 py-3 text-sm text-foreground truncate"><StrategyCustomCell column={c} value={r.custom_fields?.[c.id]} /></td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}