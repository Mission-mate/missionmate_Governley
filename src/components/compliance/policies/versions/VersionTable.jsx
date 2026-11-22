import React from 'react';
import { GitBranch } from 'lucide-react';
import PlainHeader from '@/components/shared/table/PlainHeader';
import RailBadgeIcon from '@/components/shared/RailBadgeIcon';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import CircleCheck from '@/components/shared/CircleCheck';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import { fmtDate } from '@/lib/assetRegister';
import { VERSION_STATUS_OPTIONS } from '@/lib/policyVersions';
import { cn } from '@/lib/utils';

/** Policy versions table with single-select circles. */
export default function VersionTable({ items, onOpen, selectedId, onSelect }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
      <table className="w-full table-fixed min-w-[820px]">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <PlainHeader className="w-12 py-3 pl-4" />
            <PlainHeader className="w-[32%] py-3">Title</PlainHeader>
            <PlainHeader className="w-[12%] py-3">Status</PlainHeader>
            <PlainHeader className="w-[10%] py-3">Version</PlainHeader>
            <PlainHeader className="w-[18%] py-3">Approved By</PlainHeader>
            <PlainHeader className="w-[13%] py-3">Approved Date</PlainHeader>
            <PlainHeader className="w-[13%] py-3">Effective From</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {items.map((v) => (
            <tr key={v.id} onClick={() => onOpen(v)} className={cn('border-b border-border/40 last:border-0 cursor-pointer transition-colors hover:bg-sidebar-accent/70', selectedId === v.id && 'bg-primary/5 hover:bg-primary/5')}>
              <td className="py-3 pl-4" onClick={(e) => e.stopPropagation()}>
                <CircleCheck checked={selectedId === v.id} onChange={() => onSelect(v.id)} />
              </td>
              <td className="py-3 pr-3 min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <RailBadgeIcon icon={GitBranch} tone="blue" className="w-8 h-8" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{v.display_title || v.file_name || 'Untitled'}</p>
                    {v.summary && <p className="text-xs text-muted-foreground truncate mt-0.5">{v.summary}</p>}
                  </div>
                </div>
              </td>
              <td className="py-3 px-3"><AssetBadge value={v.status} options={VERSION_STATUS_OPTIONS} /></td>
              <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{v.version_number}</td>
              <td className="py-3 px-3 text-sm text-foreground/80">
                {v.approved_by ? (
                  <div className="flex items-center gap-3 min-w-0"><PersonInitialsAvatar name={v.approved_by} /><span className="truncate">{v.approved_by}</span></div>
                ) : '—'}
              </td>
              <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{fmtDate(v.approved_date) || '—'}</td>
              <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{fmtDate(v.effective_from) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}