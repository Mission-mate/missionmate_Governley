import React from 'react';
import { Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import PlainHeader from '@/components/shared/table/PlainHeader';
import RailBadgeIcon from '@/components/shared/RailBadgeIcon';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { fmtDate, fmtMoney } from '@/lib/assetRegister';
import { MAINTENANCE_TYPE_OPTIONS } from '@/lib/maintenanceTypes';
import AssetBadge from './AssetBadge';

/** Notes-style maintenance table: title + description, type, date, provider, cost. */
export default function MaintenanceTable({ entries, selectedIds, onToggle, onOpen }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
      <table className="w-full table-fixed min-w-[720px]">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="py-2.5 pl-4 pr-0 w-12" aria-label="Select" />
            <PlainHeader className="w-[38%] py-3">Title</PlainHeader>
            <PlainHeader className="w-[14%] py-3">Type</PlainHeader>
            <PlainHeader className="w-[14%] py-3">Date</PlainHeader>
            <PlainHeader className="w-[20%] py-3">Provider</PlainHeader>
            <PlainHeader className="w-[14%] py-3">Cost</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => {
            const selected = selectedIds.includes(e.id);
            return (
              <tr key={e.id} onClick={() => onOpen(e)}
                className={cn('border-b border-border/40 last:border-0 cursor-pointer transition-colors', selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
                <td className="py-3 pl-4 pr-0" onClick={(ev) => ev.stopPropagation()}>
                  <CircleCheck checked={selected} onChange={() => onToggle(e.id)} />
                </td>
                <td className="py-3 px-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <RailBadgeIcon icon={Wrench} tone="blue" className="w-8 h-8" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{e.title || 'Untitled'}</p>
                      {e.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{e.description}</p>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3">{e.type ? <AssetBadge value={e.type} options={MAINTENANCE_TYPE_OPTIONS} /> : <span className="text-sm text-muted-foreground">—</span>}</td>
                <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{fmtDate(e.date)}</td>
                <td className="py-3 px-3 text-sm text-foreground/80">
                  {e.provider ? (
                    <div className="flex items-center gap-3 min-w-0">
                      <PersonInitialsAvatar name={e.provider} />
                      <span className="truncate">{e.provider}</span>
                    </div>
                  ) : '—'}
                </td>
                <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{fmtMoney(e.cost) || '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}