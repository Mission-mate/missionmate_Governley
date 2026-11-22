import React from 'react';
import { format, parseISO } from 'date-fns';
import { Eye, ExternalLink, Download, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import MeetingDocumentIcon from './MeetingDocumentIcon';
import RowSelectCircle from '@/components/strategy/selection/RowSelectCircle';
import { docTypeLabel } from '@/lib/boardDocuments';

const ICON_BTN = 'hover:text-foreground transition-colors';

/**
 * One meeting document card: single-select circle, file details and hover
 * View / Open / Download icons. In move mode the selected row shows a drag
 * handle (dragHandleProps) and the other rows are dimmed.
 */
export default function MeetingDocumentRow({ doc, selected, onSelect, onView, onOpen, onDownload, moving = false, dragHandleProps, isDragging = false }) {
  let dateStr = '';
  try { dateStr = doc.created_date ? format(parseISO(doc.created_date), 'dd MMM yyyy') : ''; } catch { /* ignore */ }
  const draggable = moving && selected;

  return (
    <div
      className={cn(
        'group flex items-center gap-3 border rounded-xl px-4 py-2 bg-card transition-[transform,box-shadow,opacity,border-color] duration-200 ease-out motion-reduce:transition-none',
        selected ? 'border-primary/60 ring-1 ring-primary/30' : 'border-border',
        !moving && 'hover:-translate-y-0.5 hover:shadow-md focus-within:-translate-y-0.5 focus-within:shadow-md dark:hover:shadow-black/30 motion-reduce:hover:translate-y-0',
        moving && !selected && 'opacity-50',
        isDragging && 'shadow-lg dark:shadow-black/40'
      )}
    >
      {draggable ? (
        <span {...dragHandleProps} title="Drag to reorder" className="text-primary cursor-grab active:cursor-grabbing -ml-1">
          <GripVertical className="w-4 h-4" />
        </span>
      ) : (
        <RowSelectCircle checked={selected} onChange={() => onSelect(doc)} />
      )}
      <MeetingDocumentIcon doc={doc} />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-foreground truncate">{doc.title}</p>
        <p className="text-xs text-muted-foreground">{docTypeLabel(doc.doc_type)}{dateStr ? ` · ${dateStr}` : ''}</p>
      </div>
      {/* Shown on hover or keyboard focus; always shown on touch screens. Hidden while reordering. */}
      {!moving && (
        <div className="flex items-center gap-3 text-muted-foreground shrink-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 [@media(hover:none)]:opacity-100">
          <button type="button" onClick={() => onView(doc)} title="View" className={ICON_BTN}><Eye className="w-4 h-4" /></button>
          <button type="button" onClick={() => onOpen(doc)} title="Open" className={ICON_BTN}><ExternalLink className="w-4 h-4" /></button>
          <button type="button" onClick={() => onDownload(doc)} title="Download" className={ICON_BTN}><Download className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}