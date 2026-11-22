import React from 'react';
import { Download, ExternalLink, Eye } from 'lucide-react';
import { format } from 'date-fns';
import CircleCheck from '@/components/shared/CircleCheck';
import FileTypeIcon from './FileTypeIcon';

const ACTION = 'p-1 rounded text-muted-foreground hover:text-foreground transition-colors';

/** One file in the folder detail list: selector, type icon, title with its added date beneath, and hover actions. */
export default function FolderFileRow({ doc, selected = false, onSelect, onView, onOpen, onDownload }) {
  return (
    <div className="group flex items-center gap-3 py-3 border-b border-border last:border-0">
      {onSelect && <CircleCheck checked={selected} onChange={onSelect} />}
      <span className="shrink-0 flex transition-transform duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none">
        <FileTypeIcon fileName={doc.file_name} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors">{doc.title}</p>
        {doc.created_date &&
          <p className="text-xs text-muted-foreground">Added {format(new Date(doc.created_date), 'dd MMM yyyy')}</p>
        }
      </div>
      <div className="shrink-0 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
        {doc.file_url &&
          <>
            <button type="button" onClick={onView} title="View" className={ACTION}>
              <Eye className="w-4 h-4" />
            </button>
            <button type="button" onClick={onOpen} title="Open" className={ACTION}>
              <ExternalLink className="w-4 h-4" />
            </button>
            <button type="button" onClick={onDownload} title="Download" className={ACTION}>
              <Download className="w-4 h-4" />
            </button>
          </>
        }
      </div>
    </div>
  );
}