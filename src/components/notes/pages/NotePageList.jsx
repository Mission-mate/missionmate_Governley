import React from 'react';
import { format } from 'date-fns';
import { ExternalLink, Plus } from 'lucide-react';
import CircleCheck from '@/components/shared/CircleCheck';
import FolderPager from '@/components/documents/FolderPager';
import NoteIcon from '@/components/notes/NoteIcon';
import IconTip from '@/components/shared/IconTip';
import { cn } from '@/lib/utils';

const ROW = 'pane-bleed-row group flex items-center gap-3 py-3';

/**
 * Note list for side-pane Notes tabs, matching the Documents folder list: note name with its
 * created date and owner beneath it, and an open icon on hover. The header row carries the pager.
 * `onSelect` adds selection circles; `onNewNote` adds a dashed "New note" row at the end.
 */
export default function NotePageList({ notes, selectedId, onSelect, onOpen, onNewNote, page, totalPages, onPageChange }) {
  return (
    <div>
      <div className="pane-bleed-divider flex items-center gap-3 pb-2.5">
        {onSelect && <span className="w-5 shrink-0" />}
        <span className="w-9 shrink-0" />
        <span className="flex-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Note Name</span>
        <FolderPager page={page} totalPages={totalPages} onPageChange={onPageChange} />
      </div>
      {notes.map((note) =>
        <div
          key={note.id}
          role="button"
          tabIndex={0}
          onClick={() => onOpen(note)}
          onKeyDown={(e) => { if (e.key === 'Enter' && e.target === e.currentTarget) onOpen(note); }}
          className={cn(ROW, 'cursor-pointer select-none', !onNewNote && 'last:after:hidden')}>
          {onSelect &&
            <CircleCheck checked={note.id === selectedId} onChange={(e) => { e.stopPropagation(); onSelect(note.id); }} />}
          <span className="w-9 shrink-0 flex items-center transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none">
            <NoteIcon color={note.color} size={28} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="min-w-0 truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{note.title}</p>
            <p className="mt-0.5 text-xs text-muted-foreground truncate">
              {note.created_date && `Created ${format(new Date(note.created_date), 'dd MMM yyyy')} · `}
              {note.owner_name || 'No owner'}
            </p>
          </div>
          <IconTip label="Open">
            <span className="mr-1 shrink-0 flex text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
              <ExternalLink className="w-4 h-4" />
            </span>
          </IconTip>
        </div>
      )}
      {onNewNote &&
        <button type="button" onClick={onNewNote} className={cn(ROW, 'w-full text-left')}>
          {onSelect && <span className="w-5 shrink-0" />}
          <span className="w-9 shrink-0 flex items-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-muted-foreground/50 text-muted-foreground transition-colors group-hover:border-primary group-hover:bg-primary/10 group-hover:text-primary">
              <Plus className="w-3.5 h-3.5" />
            </span>
          </span>
          <span className="text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">New note</span>
        </button>
      }
    </div>
  );
}