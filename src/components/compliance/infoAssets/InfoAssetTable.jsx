import React from 'react';
import CircleCheck from '@/components/shared/CircleCheck';
import { cn } from '@/lib/utils';
import AssetBadge from '@/components/compliance/assets/AssetBadge';
import StrategyCustomCell from '@/components/strategy/customFields/StrategyCustomCell';
import { DEFAULT_COLUMN_WIDTH } from '@/lib/registerColumnTypes';
import { RECORD_TYPE_OPTIONS, INFO_STATUS_OPTIONS, SECURITY_CLASSIFICATION_OPTIONS, RISK_EXPOSURE_OPTIONS } from '@/lib/infoAssetRegister';

const HEAD = 'text-left px-4 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide';
const COLS = [['Information Asset', '36%'], ['Record Type', '10%'], ['Status', '9%'], ['Location', '11%'], ['Business Function', '12%'], ['Classification', '12%'], ['Risk Exposure', '10%']];

const BASE_PX = 1170; // min table width (px) for system columns when custom columns force horizontal scroll

export default function InfoAssetTable({ items, selectedIds, onToggle, onOpen, emptyText, customColumns = [] }) {
  const hasCustom = customColumns.length > 0;
  return (
    <div className={hasCustom ? 'overflow-x-auto' : ''}>
    <table className="w-full table-fixed" style={hasCustom ? { minWidth: BASE_PX + customColumns.length * DEFAULT_COLUMN_WIDTH } : undefined}>
      <colgroup>
        <col style={{ width: '56px' }} />{COLS.map(([h, w]) => <col key={h} style={{ width: w }} />)}
        {customColumns.map((c) => <col key={c.id} style={{ width: `${DEFAULT_COLUMN_WIDTH}px` }} />)}
      </colgroup>
      <thead>
        <tr className="bg-secondary/40 border-b border-border">
          <th className="px-4 py-2.5" aria-label="Select" />
          {COLS.map(([h]) => <th key={h} className={cn(HEAD, 'whitespace-nowrap')}>{h}</th>)}
          {customColumns.map((c) => <th key={c.id} className={cn(HEAD, 'truncate')}>{c.title}</th>)}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {items.length === 0 ? (
          <tr><td colSpan={COLS.length + 1 + customColumns.length} className="py-12 text-center text-muted-foreground text-sm">{emptyText}</td></tr>
        ) : items.map((a) => (
          <tr key={a.id} onClick={() => onOpen(a)} className={cn('cursor-pointer transition-colors', selectedIds.has(a.id) ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <CircleCheck checked={selectedIds.has(a.id)} onChange={() => onToggle(a.id)} />
            </td>
            <td className="px-4 py-3">
              <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
              {a.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{a.description}</p>}
            </td>
            <td className="px-4 py-3"><AssetBadge value={a.record_type} options={RECORD_TYPE_OPTIONS} /></td>
            <td className="px-4 py-3"><AssetBadge value={a.status} options={INFO_STATUS_OPTIONS} /></td>
            <td className="px-4 py-3 text-sm text-foreground truncate">{a.location || <span className="text-muted-foreground/50">—</span>}</td>
            <td className="px-4 py-3 text-sm text-foreground truncate">{a.business_function || <span className="text-muted-foreground/50">—</span>}</td>
            <td className="px-4 py-3"><AssetBadge value={a.security_classification} options={SECURITY_CLASSIFICATION_OPTIONS} /></td>
            <td className="px-4 py-3"><AssetBadge value={a.risk_exposure} options={RISK_EXPOSURE_OPTIONS} /></td>
            {customColumns.map((c) => (
              <td key={c.id} className="px-4 py-3 text-sm text-foreground truncate">
                <StrategyCustomCell column={c} value={a.custom_fields?.[c.id]} />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}