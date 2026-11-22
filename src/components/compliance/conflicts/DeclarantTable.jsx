import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import OptionBadge from '@/components/board/registers/OptionBadge';
import { RISK_STYLES, formatDate } from '@/lib/conflictOfInterest';
import { DECLARANT_STATUS_OPTIONS } from '@/lib/declarantRegister';
import { cn } from '@/lib/utils';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide';
const COLS = [
  ['Declarant', '24%'], ['Role', '12%'], ['Person Type', '13%'], ['Open Conflicts', '12%'],
  ['Highest Risk Exposure', '15%'], ['Last Declaration', '14%'], ['Status', '10%'],
];
const Dash = () => <span className="text-muted-foreground">—</span>;

/** Declarants Register table — one row per person, with calculated governance columns. */
export default function DeclarantTable({ items, stats, typeOptions, selectedIds, onToggle, onOpen, emptyText }) {
  return (
    <table className="w-full table-fixed">
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
          const s = stats[p.id] || { openCount: 0, highestRisk: '' };
          return (
            <tr key={p.id} onClick={() => onOpen(p)} className={cn('cursor-pointer transition-colors', selectedIds.has(p.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
              <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selectedIds.has(p.id)} onChange={() => onToggle(p.id)} /></td>
              <td className="px-4 py-3 text-sm text-foreground">
                <div className="flex items-center gap-3 min-w-0">
                  <PersonInitialsAvatar name={p.full_name} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{[p.declarant_code, p.email].filter(Boolean).join(' · ') || '—'}</p>
                  </div>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-foreground truncate">{p.role || <Dash />}</td>
              <td className="px-4 py-3 text-sm truncate">{p.person_type ? <AssetBadge value={p.person_type} options={typeOptions} /> : <Dash />}</td>
              <td className="px-4 py-3 text-sm text-foreground tabular-nums">{s.openCount}</td>
              <td className="px-4 py-3 text-sm">{s.highestRisk ? <OptionBadge label={s.highestRisk} {...RISK_STYLES[s.highestRisk]} /> : <Dash />}</td>
              <td className="px-4 py-3 text-sm text-foreground truncate">{p.last_declaration_date ? formatDate(p.last_declaration_date) : <Dash />}</td>
              <td className="px-4 py-3 text-sm"><AssetBadge value={p.status || 'Active'} options={DECLARANT_STATUS_OPTIONS} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}