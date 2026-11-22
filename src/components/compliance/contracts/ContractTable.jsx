import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { cn } from '@/lib/utils';
import { overdueLabel } from '@/lib/overdueLabel';
import { localToday } from '@/lib/localClock';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { formatMoney } from '@/lib/giftRegister';
import { CONTRACT_STATUS_OPTIONS } from '@/lib/contractRegister';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';
const COLS = [['Contract', '50%'], ['Value', '10%'], ['Start Date', '10%'], ['Expiry Date', '10%'], ['Next Review Date', '11%'], ['Status', '9%']];
const dash = <span className="text-muted-foreground/50">—</span>;
const date = (v) => (v ? formatReviewDate(v) : dash);
const ReviewDate = ({ c }) => {
  const v = c.next_review_date;
  if (!v) return <span className="text-sm">{dash}</span>;
  const overdue = (c.status || 'Active') === 'Active' && v < localToday();
  return (
    <span className={cn('text-sm whitespace-nowrap', overdue ? 'text-destructive font-semibold' : 'text-foreground')}>
      {formatReviewDate(v)}
      {overdue && <span className="block text-xs font-normal text-destructive">{overdueLabel(v)}</span>}
    </span>
  );
};
const PersonMeta = ({ label, name }) => name ? (
  <span className="inline-flex items-center gap-1.5 min-w-0">
    <span className="shrink-0">{label}:</span>
    <PersonInitialsAvatar name={name} className="h-5 w-5 text-[9px]" />
    <span className="truncate">{name}</span>
  </span>
) : null;

export default function ContractTable({ items, typeOptions, selectedIds, onToggle, onOpen, emptyText }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed min-w-[1100px]">
        <colgroup><col style={{ width: '56px' }} />{COLS.map(([h, w]) => <col key={h} style={{ width: w }} />)}</colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5" />
            {COLS.map(([h]) => <th key={h} className={HEAD}>{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr><td colSpan={COLS.length + 1} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
          ) : items.map((c) => (
            <tr key={c.id} onClick={() => onOpen(c)} className={cn('cursor-pointer transition-colors', selectedIds.has(c.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selectedIds.has(c.id)} onChange={() => onToggle(c.id)} /></td>
              <td className="px-4 py-3">
                <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                <div className="flex items-center gap-3 mt-1.5 min-w-0 text-sm text-foreground/80">
                  <span className="shrink-0">{c.contract_code}</span>
                  {c.contract_type && <span className="shrink-0"><AssetBadge value={c.contract_type} options={typeOptions} /></span>}
                  <PersonMeta label="Owner" name={c.owner} />
                  <PersonMeta label="Manager" name={c.manager} />
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground tabular-nums">{formatMoney(c.value) || dash}</td>
              <td className="px-4 py-3 text-sm text-foreground">{date(c.start_date)}</td>
              <td className="px-4 py-3 text-sm text-foreground">{date(c.expiry_date)}</td>
              <td className="px-4 py-3"><ReviewDate c={c} /></td>
              <td className="px-4 py-3"><AssetBadge value={c.status} options={CONTRACT_STATUS_OPTIONS} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}