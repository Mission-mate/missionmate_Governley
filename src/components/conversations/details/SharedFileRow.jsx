import React from 'react';
import { format } from 'date-fns';
import CircleCheck from '@/components/shared/CircleCheck';
import FileTypeIcon from '@/components/documents/FileTypeIcon';

/** One shared file: its selection circle, then the type icon, name and added date, which open the file. */
export default function SharedFileRow({ file, selected, onSelect, onOpen }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-0">
      <CircleCheck checked={selected} onChange={onSelect} />
      <button type="button" onClick={onOpen} title="Open file" className="group flex-1 min-w-0 flex items-center gap-3 text-left">
        <span className="shrink-0 flex transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none">
          <FileTypeIcon fileName={file.attachment_name} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{file.attachment_name}</span>
          <span className="block text-xs text-muted-foreground">Added {format(new Date(file.sent_at), 'dd MMM yyyy')}</span>
        </span>
      </button>
    </div>
  );
}