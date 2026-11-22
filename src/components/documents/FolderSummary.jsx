import React from 'react';
import { format } from 'date-fns';
import { folderLastUpdated } from '@/lib/documentFolders';
import { cn } from '@/lib/utils';
import FolderIcon, { FOLDER_COLOR_MAP } from './FolderIcon';

/** Folder identity block: tinted icon, name, file count and last-updated date. */
export default function FolderSummary({ folder, docs, className }) {
  const updated = folderLastUpdated(folder, docs);
  const tint = (FOLDER_COLOR_MAP[folder.color] || FOLDER_COLOR_MAP.orange).front;

  return (
    <div className={cn('flex items-center gap-3.5 min-w-0', className)}>
      <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${tint}40` }}>
        <FolderIcon color={folder.color || 'orange'} size={24} />
      </div>
      <div className="min-w-0">
        <h3 className="text-lg font-bold text-foreground truncate">{folder.name}</h3>
        <p className="text-xs text-muted-foreground">
          {docs.length} {docs.length === 1 ? 'file' : 'files'}
          {updated && <> <span className="mx-1">•</span> Last updated {format(new Date(updated), 'dd MMM yyyy')}</>}
        </p>
      </div>
    </div>
  );
}