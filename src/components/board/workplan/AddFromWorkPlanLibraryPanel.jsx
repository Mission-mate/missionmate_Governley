import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, FolderOpen } from 'lucide-react';
import FolderIcon from '@/components/documents/FolderIcon';
import LibraryItemCard from '@/components/compliance/templates/LibraryItemCard';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import {
  listTemplateFolders, listTemplateItems,
  applyTemplateToRegister, isTemplateInRegister,
} from '@/lib/workPlanTemplates';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';

/** One folder row that expands to reveal its library items (Add only). */
function LibraryFolderRow({ folder, workPlan, workItems, onApplied }) {
  const [open, setOpen] = useState(false);
  const reveal = useCollapse(open);
  const [busyId, setBusyId] = useState(null);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['workPlanTemplateItems', folder.id],
    queryFn: () => listTemplateItems(folder.id),
    enabled: open,
  });

  const handleAdd = async (item) => {
    setBusyId(item.id);
    await applyTemplateToRegister(item, workPlan, workItems);
    setBusyId(null);
    onApplied?.();
  };

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/20 transition-colors"
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
                added={isTemplateInRegister(item, workItems)}
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
 * Read-only work plan library browser shown inside the "Add Work Item" pane.
 * Folders are managed from the Annual Work Plan home page.
 */
export default function AddFromWorkPlanLibraryPanel({ workPlan, workItems = [], onApplied }) {
  const { data: folders = [], isLoading } = useQuery({
    queryKey: ['workPlanTemplateFolders'],
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
        <div className="flex justify-center grayscale opacity-60"><FolderIcon color="orange" size={40} /></div>
        <p className="text-sm font-medium text-foreground mt-3">No library folders yet</p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto">
          Work plan folders are managed from the Annual Work Plan home page.
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
          workPlan={workPlan}
          workItems={workItems}
          onApplied={onApplied}
        />
      ))}
    </div>
  );
}