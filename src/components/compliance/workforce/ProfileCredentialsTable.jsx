import React from 'react';
import RowSelectCircle from '@/components/strategy/selection/RowSelectCircle';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { VALIDITY_OPTIONS, VERIFICATION_OPTIONS, STATUS_OPTIONS, statusOf, maskRef } from '@/lib/workforceRegister';
import CredentialMeta from './CredentialMeta';
import ExpiryDate from './ExpiryDate';

const TH = 'px-4 py-3 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';
const TD = 'px-4 py-3 align-top';
const HEADS = [
  ['', 'w-10'], ['Credential', 'w-[24%]'], ['Validity', 'w-[10%]'], ['Issue Date', 'w-[12%]'],
  ['Expiry Date', 'w-[15%]'], ['Verification', 'w-[12%]'], ['Verified By', 'w-[17%]'], ['Status', 'w-[10%]'],
];
const d = (v) => (v ? formatReviewDate(v) : '—');

/** A person's credentials with single-select circles. */
export default function ProfileCredentialsTable({ rows, selectedId, onSelect, onOpen, emptyText }) {
  if (!rows.length) return <p className="py-10 text-center text-sm text-muted-foreground">{emptyText}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] table-fixed">
        <thead><tr className="bg-secondary/40 border-b border-border">{HEADS.map(([h, w], i) => <th key={i} className={`${TH} ${w}`}>{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} onClick={() => onOpen(r)} className={`border-b border-border last:border-0 cursor-pointer transition-colors ${selectedId === r.id ? 'bg-primary/5' : 'hover:bg-sidebar-accent/70'}`}>
              <td className={TD} onClick={(e) => e.stopPropagation()}><RowSelectCircle checked={selectedId === r.id} onChange={() => onSelect(selectedId === r.id ? null : r.id)} /></td>
              <td className={TD}>
                <p className="text-sm font-semibold text-foreground truncate">{r.credential_name}</p>
                <CredentialMeta parts={[r.restricted ? '' : maskRef(r.reference_number), r.jurisdiction]} restricted={r.restricted} />
              </td>
              <td className={TD}><AssetBadge value={r.validity} options={VALIDITY_OPTIONS} /></td>
              <td className={`${TD} text-sm text-foreground`}>{d(r.issue_date)}</td>
              <td className={TD}><ExpiryDate row={r} /></td>
              <td className={TD}><AssetBadge value={r.verification_status} options={VERIFICATION_OPTIONS} /></td>
              <td className={`${TD} text-sm text-foreground`}>
                {r.verified_by ? <span className="flex items-center gap-2 min-w-0"><PersonInitialsAvatar name={r.verified_by} className="h-6 w-6 text-[10px] shrink-0" /><span className="truncate">{r.verified_by}</span></span> : '—'}
              </td>
              <td className={TD}><AssetBadge value={statusOf(r)} options={STATUS_OPTIONS} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}