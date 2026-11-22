import React from 'react';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import CircleCheck from '@/components/shared/CircleCheck';
import { cn } from '@/lib/utils';
import OptionLabel from '@/components/shared/OptionLabel';
import { rpStatusColor } from './rpStatus';
import TermExpiryDate from './TermExpiryDate';
import { formatReviewDate as fmt } from '@/lib/complianceRegisters';

const COLS = ['Full Name', 'Type', 'Status', 'Date Appointment', 'Appointment Term', 'Term Expiry', 'Office Held'];
// The former Committee column's 12% is shared equally across the remaining seven columns.
const width = (c) => (c === 'Full Name' ? '17.8%' : '13.7%');
const td = 'py-3 px-4 text-sm text-foreground/80 whitespace-nowrap';

const term = (r) => (r.appointment_term === 'Custom' && r.interval_value ? `${r.interval_value} ${r.interval_unit || ''}`.trim() : 'Ongoing');

const tdWrap = 'py-3 px-4 text-sm text-foreground/80 whitespace-normal break-words';
const joined = (offices, key) => [...new Set(offices.map((o) => o[key]).filter(Boolean))].join(', ') || '—';

/** Committee members with their offices; multiple offices show comma-separated. */
export default function ResponsiblePeopleTable({ rows, selectedIds, onToggle, onOpen }) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-x-auto">
      <table className="w-full min-w-[960px] table-fixed text-left">
        <colgroup><col className="w-12" />{COLS.map((c) => <col key={c} style={{ width: width(c) }} />)}</colgroup>
        <thead><tr className="bg-secondary/40 border-b border-border">
          <th className="px-4" />
          {COLS.map((c) => <th key={c} className="py-3 px-4 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap">{c}</th>)}
        </tr></thead>
        <tbody>
        {rows.map((r) => {
          const offices = r.offices || [];
          return (
              <tr key={r.id} onClick={() => onOpen(r)} className={cn('align-top border-b border-border last:border-0 transition-colors cursor-pointer', selectedIds.has(r.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}><CircleCheck checked={selectedIds.has(r.id)} onChange={() => onToggle(r.id)} /></td>
                <td className="py-3 px-4 text-sm font-medium text-foreground whitespace-nowrap">
                  <span className="flex items-center gap-2"><PersonInitialsAvatar name={r.full_name} className="h-7 w-7 text-[11px]" />{r.full_name}</span>
                </td>
                <td className={td}>{r.person_type || '—'}</td>
                <td className={td}>{r.status ? <OptionLabel name={r.status} color={rpStatusColor(r.status)} /> : '—'}</td>
                <td className={td}>{fmt(r.appointment_date)}</td>
                <td className={td}>{term(r)}</td>
                <td className={td}>{r.appointment_term === 'Custom' ? <TermExpiryDate value={r.term_expiry_date} status={r.status} /> : '—'}</td>
                <td className={tdWrap}>{joined(offices, 'office_held')}</td>
              </tr>
          );
        })}
        </tbody>
      </table>
    </div>
  );
}