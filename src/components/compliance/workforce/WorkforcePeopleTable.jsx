import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import { cn } from '@/lib/utils';
import { STATUS_OPTIONS, PERSON_TYPES, statusOf } from '@/lib/workforceRegister';
import ExpiryDate from './ExpiryDate';
import ComplianceDot from './ComplianceDot';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide';
const COLS = [['Person', '28%'], ['Status', '12%'], ['Person Type', '14%'], ['Role', '16%'], ['Next Expiry', '16%'], ['Compliance', '14%']];
const Dash = () => <span className="text-muted-foreground">—</span>;

/** Workforce register — one row per person with calculated credential columns. */
export default function WorkforcePeopleTable({ items, stats, selectedId, onSelect, onOpen, emptyText }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] table-fixed">
        <colgroup><col style={{ width: '56px' }} />{COLS.map(([l, w]) => <col key={l} style={{ width: w }} />)}</colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5" />
            {COLS.map(([l]) => <th key={l} className={HEAD}>{l}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr><td colSpan={COLS.length + 1} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
          ) : items.map((p) => {
            const s = stats[p.id];
            const checked = selectedId === p.id;
            return (
              <tr key={p.id} onClick={() => onOpen(p)} className={cn('cursor-pointer transition-colors', checked ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={checked} onChange={() => onSelect(checked ? null : p.id)} /></td>
                <td className="px-4 py-3 text-sm text-foreground">
                  <div className="flex items-center gap-3 min-w-0">
                    <PersonInitialsAvatar name={p.full_name} />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{p.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm"><AssetBadge value={statusOf(p)} options={STATUS_OPTIONS} /></td>
                <td className="px-4 py-3 text-sm truncate">{p.person_type ? <AssetBadge value={p.person_type} options={PERSON_TYPES} /> : <Dash />}</td>
                <td className="px-4 py-3 text-sm text-foreground truncate">{p.role || <Dash />}</td>
                <td className="px-4 py-3 align-top"><ExpiryDate row={s.nextExpiry} /></td>
                <td className="px-4 py-3"><ComplianceDot value={s.compliance} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}