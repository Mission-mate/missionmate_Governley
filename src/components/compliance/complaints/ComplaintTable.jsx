import React from 'react';
import { Calendar } from 'lucide-react';
import CircleCheck from '@/components/shared/CircleCheck';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { SEVERITY_OPTIONS, STATUS_OPTIONS, CORRECTIVE_ACTION_OPTIONS } from '@/lib/complaintRegister';
import { cn } from '@/lib/utils';
import StrategyCustomCell from '@/components/strategy/customFields/StrategyCustomCell';
import { DEFAULT_COLUMN_WIDTH } from '@/lib/registerColumnTypes';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';
const COLS = [['Details', '34%'], ['Status', '9%'], ['Complaint Date', '11%'], ['Severity', '10%'], ['Taken By', '18%'], ['Corrective Action', '18%']];
const dash = <span className="text-muted-foreground/50">—</span>;

export default function ComplaintTable({ items, selectedIds, onToggle, onOpen, emptyText, customColumns = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed min-w-[960px]" style={customColumns.length ? { minWidth: 960 + customColumns.length * DEFAULT_COLUMN_WIDTH } : undefined}>
        <colgroup><col style={{ width: '56px' }} />{COLS.map(([h, w]) => <col key={h} style={{ width: w }} />)}{customColumns.map((c) => <col key={c.id} style={{ width: `${DEFAULT_COLUMN_WIDTH}px` }} />)}</colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5" />
            {COLS.map(([h]) => <th key={h} className={HEAD}>{h}</th>)}
            {customColumns.map((c) => <th key={c.id} className={cn(HEAD, 'truncate')}>{c.title}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr><td colSpan={COLS.length + customColumns.length + 1} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
          ) : items.map((c) => (
            <tr key={c.id} onClick={() => onOpen(c)} className={cn('cursor-pointer transition-colors', selectedIds.has(c.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selectedIds.has(c.id)} onChange={() => onToggle(c.id)} /></td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <PersonInitialsAvatar name={c.complainant_name} className="h-7 w-7 text-[11px] shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{c.complainant_name}</p>
                    {c.details && <p className="text-sm text-foreground/80 truncate mt-0.5">{c.details}</p>}
                  </div>
                </div>
              </td>
              <td className="px-4 py-3"><AssetBadge value={c.status} options={STATUS_OPTIONS} /></td>
              <td className="px-4 py-3 text-sm text-foreground/80">
                {c.complaint_date ? <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-muted-foreground" />{formatReviewDate(c.complaint_date)}</span> : dash}
              </td>
              <td className="px-4 py-3">{c.severity ? <AssetBadge value={c.severity} options={SEVERITY_OPTIONS} /> : dash}</td>
              <td className="px-4 py-3">
                {c.taken_by ? (
                  <div className="flex items-center gap-2 min-w-0">
                    <PersonInitialsAvatar name={c.taken_by} className="h-7 w-7 text-[11px] shrink-0" />
                    <span className="text-sm text-foreground truncate">{c.taken_by}</span>
                  </div>
                ) : dash}
              </td>
              <td className="px-4 py-3">{c.corrective_action ? <AssetBadge value={c.corrective_action} options={CORRECTIVE_ACTION_OPTIONS} /> : dash}</td>
              {customColumns.map((col) => <td key={col.id} className="px-4 py-3 min-w-0"><StrategyCustomCell column={col} value={c.custom_fields?.[col.id]} /></td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}