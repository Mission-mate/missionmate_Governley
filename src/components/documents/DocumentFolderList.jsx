import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Plus } from 'lucide-react';
import CircleCheck from '@/components/shared/CircleCheck';
import { cn } from '@/lib/utils';
import IconTip from '@/components/shared/IconTip';
import FolderIcon from './FolderIcon';
import FolderPager from './FolderPager';

const ROW = 'pane-bleed-row group flex items-center gap-3 py-3';

/**
 * Folder list for side-pane document tabs: folder name with its created date and file
 * count beneath it, and an open icon on hover. The header row carries the pager;
 * `onNewFolder` adds a dashed "New folder" row at the end of the list.
 */
export default function DocumentFolderList({ rows, selectedId, onSelect, onOpen, onNewFolder, page, totalPages, onPageChange }) {
  return (
    <div>
      <div className="pane-bleed-divider flex items-center gap-3 pb-2.5">
        {onSelect && <span className="w-5 shrink-0" />}
        <span className="w-9 shrink-0" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Folder Name</span>
        <FolderPager page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
      {rows.map(({ folder, count, selectable }) =>
        <div
          key={folder.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(folder.id)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(folder.id); }}
          className={cn(ROW, 'cursor-pointer select-none', !onNewFolder && 'last:after:hidden')}>
          {onSelect && (selectable ?
            <CircleCheck checked={folder.id === selectedId} onChange={(e) => { e.stopPropagation(); onSelect(folder.id); }} /> :
            <span className="w-5 shrink-0" />)}
          <span className="w-9 shrink-0 flex items-center transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none">
            <FolderIcon color={folder.color || 'orange'} size={28} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="min-w-0 truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{folder.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {folder.created_date && `Created ${format(new Date(folder.created_date), 'dd MMM yyyy')} · `}
              {count} {count === 1 ? 'File' : 'Files'}
            </p>
          </div>
          <IconTip label="Open">
            <span className="mr-1 shrink-0 flex text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ExternalLink className="w-4 h-4" />
            </span>
          </IconTip>
        </div>
      )}
      {onNewFolder &&
        <button type="button" onClick={onNewFolder} className={cn(ROW, 'w-full text-left')}>
          {onSelect && <span className="w-5 shrink-0" />}
          <span className="w-9 shrink-0 flex items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-muted-foreground/50 text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </span>
          <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">New folder</span>
        </button>
      }
    </div>
  );
}