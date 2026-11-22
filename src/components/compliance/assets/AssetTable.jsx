import React from 'react';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import StrategyCustomCell from '@/components/strategy/customFields/StrategyCustomCell';
import { DEFAULT_COLUMN_WIDTH } from '@/lib/registerColumnTypes';
import { ASSET_STATUS_OPTIONS, CONDITION_OPTIONS } from '@/lib/assetRegister';
import AssetBadge from './AssetBadge';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';
const WIDTHS = ['5%', '27%', '14%', '14%', '18%', '11%', '11%'];
const BASE_PX = [56, 320, 160, 160, 200, 130, 130];

/** Asset register table — mirrors the Compliance Calendar row anatomy. Custom columns are read-only. */
export default function AssetTable({ items, selectedIds, onToggle, onOpen, emptyText, customColumns = [] }) {
  const hasCustom = customColumns.length > 0;
  const colCount = 7 + customColumns.length;

  return (
    <div className={hasCustom ? 'overflow-x-auto' : ''}>
      <table
        className="w-full table-fixed"
        style={hasCustom ? { minWidth: BASE_PX.reduce((s, w) => s + w, 0) + customColumns.length * DEFAULT_COLUMN_WIDTH } : undefined}
      >
        <colgroup>
          {(hasCustom ? BASE_PX.map((w) => `${w}px`) : WIDTHS).map((w, i) => <col key={i} style={{ width: w }} />)}
          {customColumns.map((c) => <col key={c.id} style={{ width: `${DEFAULT_COLUMN_WIDTH}px` }} />)}
        </colgroup>
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="px-4 py-2.5" aria-label="Select" />
            {['Asset', 'Asset Type', 'Location', 'Asset Manager', 'Condition', 'Status'].map((h) => <th key={h} className={HEAD}>{h}</th>)}
            {customColumns.map((c) => <th key={c.id} className={cn(HEAD, 'truncate')}>{c.title}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.length === 0 ? (
            <tr><td colSpan={colCount} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
          ) : items.map((a) => {
            const selected = selectedIds.has(a.id);
            return (
              <tr key={a.id} onClick={() => onOpen(a)} className={cn('transition-colors cursor-pointer', selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <CircleCheck checked={selected} onChange={() => onToggle(a.id)} />
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{a.title}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                    <span>Asset ID: {a.asset_id || '—'}</span>
                    {a.serial_number && <><span>·</span><span>S/N: {a.serial_number}</span></>}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-foreground truncate">{a.asset_type || <span className="text-muted-foreground/50">—</span>}</td>
                <td className="px-4 py-3 text-sm text-foreground truncate">{a.location || <span className="text-muted-foreground/50">—</span>}</td>
                <td className="px-4 py-3">
                  {a.asset_manager
                    ? <div className="flex items-center gap-2 min-w-0">
                        <PersonInitialsAvatar name={a.asset_manager} className="h-8 w-8" />
                        <span className="text-sm text-foreground truncate" title={a.asset_manager}>{a.asset_manager}</span>
                      </div>
                    : <span className="text-sm text-muted-foreground/50">—</span>}
                </td>
                <td className="px-4 py-3"><AssetBadge value={a.condition} options={CONDITION_OPTIONS} /></td>
                <td className="px-4 py-3"><AssetBadge value={a.status} options={ASSET_STATUS_OPTIONS} /></td>
                {customColumns.map((c) => (
                  <td key={c.id} className="px-4 py-3 min-w-0">
                    <StrategyCustomCell column={c} value={a.custom_fields?.[c.id]} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}