import React from 'react';
import { X } from 'lucide-react';
import { fileSize } from '@/lib/conversations';

/** The files waiting to be sent with the message, each removable. */
export default function CopilotComposerFiles({ files, onRemove }) {
  if (files.length === 0) return null;
  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {files.map(({ id, file }) => (
        <li
          key={id}
          className="flex max-w-full items-center gap-2 rounded-full border border-border bg-muted py-1 pl-3 pr-1 text-xs text-foreground"
        >
          <span className="truncate">{file.name}</span>
          <span className="shrink-0 text-muted-foreground">{fileSize(file.size)}</span>
          <button
            type="button"
            onClick={() => onRemove(id)}
            aria-label={`Remove ${file.name}`}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-3 w-3" />
          </button>
        </li>
      ))}
    </ul>
  );
}