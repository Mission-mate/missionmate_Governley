import React from 'react';
import { format, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import PlainHeader from '@/components/shared/table/PlainHeader';
import FolderIcon from './FolderIcon';

const fmt = (d) => { const p = d ? new Date(d) : null; return p && isValid(p) ? format(p, 'dd MMM yyyy') : '—'; };

/** Notes-style folder table for full-page document tabs: folder title, file count, created and last-updated dates. */
export default function DocumentFolderTable({ rows, selectedId, onSelect, onOpen }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-x-auto">
      <table className="w-full table-fixed min-w-[560px]">
        <thead>
          <tr className="bg-secondary/40 border-b border-border">
            <th className="py-2 pl-4 pr-0 w-12" />
            <PlainHeader className="w-[44%] py-2">Folder Name</PlainHeader>
            <PlainHeader className="w-[16%] py-2">Files</PlainHeader>
            <PlainHeader className="w-[20%] py-2">Created</PlainHeader>
            <PlainHeader className="w-[20%] py-2">Last Updated</PlainHeader>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ folder, count, lastUpdated, selectable }) => {
            const selected = folder.id === selectedId;
            return (
              <tr
                key={folder.id}
                onClick={() => onOpen(folder.id)}
                className={cn('group border-b border-border/40 last:border-0 cursor-pointer transition-colors', selected ? 'bg-primary/10' : 'hover:bg-sidebar-accent/70')}>
                <td className="py-3 pl-4 pr-0" onClick={(e) => e.stopPropagation()}>
                  {selectable && onSelect && <CircleCheck checked={selected} onChange={() => onSelect(selected ? null : folder.id)} />}
                </td>
                <td className="py-3 px-3 min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="shrink-0 flex items-center transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none">
                      <FolderIcon color={folder.color || 'orange'} size={24} />
                    </span>
                    <p className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{folder.name}</p>
                  </div>
                </td>
                <td className="py-3 px-3">
                  <span className="inline-flex items-center justify-center min-w-7 h-7 px-2 rounded-full bg-muted text-xs font-semibold text-foreground tabular-nums">
                    {count}
                  </span>
                </td>
                <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{fmt(folder.created_date)}</td>
                <td className="py-3 px-3 text-sm tabular-nums text-foreground/80">{lastUpdated ? fmt(lastUpdated) : ''}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}