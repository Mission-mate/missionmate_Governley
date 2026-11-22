import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import GroupSeparatorRow from '@/components/shared/table/GroupSeparatorRow';
import { cn } from '@/lib/utils';
import { VALIDITY_OPTIONS, VERIFICATION_OPTIONS, STATUS_OPTIONS, statusOf, maskRef } from '@/lib/workforceRegister';
import CredentialMeta from './CredentialMeta';
import ExpiryDate from './ExpiryDate';

const TH = 'px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';
const TD = 'px-4 py-3 align-top';
const COLS = [['Credential', '25%'], ['Person', '24%'], ['Validity', '11%'], ['Expiry Date', '16%'], ['Verification', '13%'], ['Status', '11%']];

function Row({ r, checked, onSelect, onView }) {
  return (
    <tr onClick={() => onView(r)} className={cn('border-b border-border last:border-0 cursor-pointer transition-colors', checked ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
      <td className={TD} onClick={(e) => e.stopPropagation()}><CircleCheck checked={checked} onChange={() => onSelect(checked ? null : r.id)} /></td>
      <td className={TD}>
        <p className="text-sm font-semibold text-foreground truncate">{r.credential_name}</p>
        <CredentialMeta parts={[r.restricted ? '' : maskRef(r.reference_number), r.jurisdiction]} restricted={r.restricted} />
      </td>
      <td className={TD}>
        <div className="flex items-center gap-3 min-w-0">
          <PersonInitialsAvatar name={r.person.full_name} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{r.person.full_name}</p>
            <p className="text-xs text-muted-foreground truncate">{r.person.person_type || '—'}</p>
          </div>
        </div>
      </td>
      <td className={TD}><AssetBadge value={r.validity} options={VALIDITY_OPTIONS} /></td>
      <td className={TD}><ExpiryDate row={r} /></td>
      <td className={TD}><AssetBadge value={r.verification_status} options={VERIFICATION_OPTIONS} /></td>
      <td className={TD}><AssetBadge value={statusOf(r)} options={STATUS_OPTIONS} /></td>
    </tr>
  );
}

/** Main Credentials register: flat rows, or grouped sections when `groups` is given. Single-select circles; rows open the read-only pane. */
export default function CredentialsRegisterTable({ rows, groups, selectedId, onSelect, onView, emptyText }) {
  if (!rows.length) return <p className="py-12 text-center text-sm text-muted-foreground">{emptyText}</p>;
  const row = (r) => <Row key={r.id} r={r} checked={selectedId === r.id} onSelect={onSelect} onView={onView} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed">
        <colgroup><col style={{ width: '56px' }} />{COLS.map(([l, w]) => <col key={l} style={{ width: w }} />)}</colgroup>
        <thead><tr className="bg-secondary/40 border-b border-border"><th className="px-4 py-3" />{COLS.map(([h]) => <th key={h} className={TH}>{h}</th>)}</tr></thead>
        <tbody>
          {groups ? groups.map((g, i) => (
            <React.Fragment key={g.key}>
              <GroupSeparatorRow label={g.label} count={g.rows.length} colSpan={COLS.length + 1} isFirst={i === 0} />
              {g.rows.map(row)}
            </React.Fragment>
          )) : rows.map(row)}
        </tbody>
      </table>
    </div>
  );
}