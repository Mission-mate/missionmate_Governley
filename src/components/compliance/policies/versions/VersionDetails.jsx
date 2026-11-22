import React from 'react';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import SectionCard from '@/components/shared/SectionCard';
import { fmtDate } from '@/lib/assetRegister';
import { VERSION_STATUS_OPTIONS } from '@/lib/policyVersions';

const Item = ({ label, children, full }) => (
  <div className={full ? 'col-span-2' : ''}>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    <div className="text-sm text-foreground whitespace-pre-wrap break-words">{children || '—'}</div>
  </div>
);
const GRID = 'grid grid-cols-2 gap-x-6 gap-y-4';

/** Read-only metadata of one policy version, grouped like the version form. */
export default function VersionDetails({ version: v }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Version Details"><div className={GRID}>
        <Item label="Document Display Title" full>{v.display_title || v.file_name}</Item>
        <Item label="Version Number">{v.version_number}</Item>
        <Item label="Document Status"><AssetBadge value={v.status} options={VERSION_STATUS_OPTIONS} /></Item>
        <Item label="Summary of Changes" full>{v.summary}</Item>
        <Item label="Document File" full>{v.file_name}</Item>
      </div></SectionCard>
      <SectionCard title="Approval Details"><div className={GRID}>
        <Item label="Approved By">{v.approved_by}</Item>
        <Item label="Approval Date">{fmtDate(v.approved_date)}</Item>
        <Item label="Minute Reference">{v.minute_reference}</Item>
        <Item label="Effective From">{fmtDate(v.effective_from)}</Item>
      </div></SectionCard>
    </div>
  );
}