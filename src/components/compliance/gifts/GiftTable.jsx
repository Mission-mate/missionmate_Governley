import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import { cn } from '@/lib/utils';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { GIFT_TYPE_OPTIONS, COI_OPTIONS, APPROVAL_OPTIONS, formatMoney } from '@/lib/giftRegister';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide';
const COLS = [['Gift/Benefit', '38%'], ['Type', '8%'], ['Presented By', '10%'], ['Received By', '10%'], ['Market Value', '10%'], ['Conflicts', '12%'], ['Approval Decision', '12%']];
const dash = <span className="text-muted-foreground/50">—</span>;

export default function GiftTable({ items, selectedIds, onToggle, onOpen, emptyText }) {
  return (
    <div className="overflow-x-auto">
    <table className="w-full table-fixed min-w-[1200px]">
      <colgroup><col style={{ width: '56px' }} />{COLS.map(([h, w]) => <col key={h} style={{ width: w }} />)}</colgroup>
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="px-4 py-2.5" />
          {COLS.map(([h]) => <th key={h} className={cn(HEAD, 'whitespace-nowrap')}>{h}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.length === 0 ? (
          <tr><td colSpan={COLS.length + 1} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
        ) : items.map((g) => (
          <tr key={g.id} onClick={() => onOpen(g)} className={cn('cursor-pointer transition-colors', selectedIds.has(g.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selectedIds.has(g.id)} onChange={() => onToggle(g.id)} /></td>
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-foreground truncate">{g.title || g.description}</p>
              {g.title && g.description && <p className="text-sm text-foreground/80 truncate mt-0.5">{g.description}</p>}
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {g.record_code} · Received {formatReviewDate(g.date_received)} · Declared {formatReviewDate(g.declaration_date)}
              </p>
            </td>
            <td className="px-4 py-3"><AssetBadge value={g.gift_type} options={GIFT_TYPE_OPTIONS} /></td>
            <td className="px-4 py-3 text-sm text-foreground truncate">{g.presented_by || dash}</td>
            <td className="px-4 py-3 text-sm text-foreground truncate">{g.received_by || dash}</td>
            <td className="px-4 py-3 text-sm text-foreground tabular-nums">{formatMoney(g.estimated_value) || dash}</td>
            <td className="px-4 py-3"><AssetBadge value={g.conflict_of_interest} options={COI_OPTIONS} /></td>
            <td className="px-4 py-3"><AssetBadge value={g.approval_decision} options={APPROVAL_OPTIONS} /></td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}