import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FolderOpen } from 'lucide-react';
import FolderIcon from '@/components/documents/FolderIcon';
import LibraryItemCard from './LibraryItemCard';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import {
  listTemplateFolders, listTemplateObligations,
  applyTemplateToRegister, isTemplateInRegister,
} from '@/lib/complianceTemplates';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';

/** One folder row that expands to reveal its compliance items (read-only, Add only). */
function LibraryFolderRow({ folder, register, registerObligations, onApplied }) {
  const [open, setOpen] = useState(false);
  const reveal = useCollapse(open);
  const [busyId, setBusyId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['complianceTemplateObligations', folder.id],
    queryFn: () => listTemplateObligations(folder.id),
    enabled: open,
  });

  const handleAdd = async (item) => {
    setBusyId(item.id);
    await applyTemplateToRegister(item, register, registerObligations);
    setBusyId(null);
    onApplied?.();
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/40 transition-colors"
      >
        <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-90')} />
        <FolderIcon color={folder.color || 'orange'} size={20} />
        <span className="text-sm font-medium text-foreground truncate">{folder.name}</span>
      </button>

      {reveal.mounted && (
        <div className={cn(reveal.className, 'border-t border-border bg-muted/10 px-3 py-2.5 space-y-2.5')}>
          {isLoading ? (
            <div className="flex items-center justify-center min-h-[64px]">
              <LoaderOne />
            </div>
          ) : items.length === 0 ? (
            <div className="py-4 text-center">
              <FolderOpen className="w-6 h-6 mx-auto mb-1.5 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">This folder is empty</p>
            </div>
          ) : (
            items.map((item) => (
              <LibraryItemCard
                key={item.id}
                item={item}
                action="add"
                added={isTemplateInRegister(item, registerObligations)}
                busy={busyId === item.id}
                onAdd={() => handleAdd(item)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Read-only compliance library browser shown inside the "Add Obligation" modal.
 * Users can expand folders and Add items to the current register — they cannot
 * create folders or remove library items here (that's managed on the Calendar home page).
 */
export default function AddFromLibraryPanel({ register, registerObligations = [], onApplied }) {
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['complianceTemplateFolders'],
    queryFn: listTemplateFolders,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <LoaderOne />
      </div>
    );
  }

  if (folders.length === 0) {
    return (
      <div className="text-center py-12">
        <FolderIcon color="orange" size={40} />
        <p className="text-sm font-medium text-foreground mt-3">No library folders yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Compliance folders are managed from the Compliance Calendar home page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {folders.map((f) => (
        <LibraryFolderRow
          key={f.id}
          folder={f}
          register={register}
          registerObligations={registerObligations}
          onApplied={onApplied}
        />
      ))}
    </div>
  );
}