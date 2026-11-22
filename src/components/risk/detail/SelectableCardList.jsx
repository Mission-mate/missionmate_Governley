import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import Pagination from '@/components/shared/Pagination';
import AssetBulkBar from '@/components/compliance/assets/AssetBulkBar';

const PAGE_SIZE = 20;
const TH = 'text-left px-4 py-3 text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap';

/**
 * Paged (20/page) single-select table with floating View / Edit / Delete bar.
 * `columns` = [{ label, render(item) }]; row click opens the view pane.
 */
export default function SelectableCardList({ items, columns, onView, onEdit, onDelete }) {
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  const selected = items.find((i) => i.id === selectedId) || null;
  const act = (fn) => { setSelectedId(null); if (selected) fn(selected); };
  const visible = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <th className="px-4 py-3 w-10" />
              {columns.map((c) => <th key={c.label} className={cn(TH, c.width)}>{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {visible.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <tr
                  key={item.id}
                  onClick={() => { setSelectedId(null); onView(item); }}
                  className={cn('border-b border-border last:border-0 hover:bg-sidebar-accent/70 transition-colors cursor-pointer', isSelected && 'bg-primary/5 hover:bg-primary/5')}
                >
                  <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                    <CircleCheck checked={isSelected} onChange={() => setSelectedId(isSelected ? null : item.id)} />
                  </td>
                  {columns.map((c) => <td key={c.label} className={cn('px-4 py-4', c.cellClass)}>{c.render(item)}</td>)}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {items.length > PAGE_SIZE && (
        <Pagination page={page} totalPages={totalPages} total={items.length} pageSize={PAGE_SIZE}
          pageSizeOptions={[PAGE_SIZE]} onPageChange={(p) => { setSelectedId(null); setPage(p); }} onPageSizeChange={() => {}} />
      )}
      <AssetBulkBar count={selected ? 1 : 0} onView={() => act(onView)} onEdit={() => act(onEdit)}
        onDelete={() => act(onDelete)} onClear={() => setSelectedId(null)} />
    </>
  );
}