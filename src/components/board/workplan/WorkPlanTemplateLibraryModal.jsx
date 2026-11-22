import CloseButton from '@/components/shared/CloseButton';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import FolderFormModal from '@/components/documents/FolderFormModal';
import FolderIcon from '@/components/documents/FolderIcon';
import {
  listTemplateFolders, createTemplateFolder, saveItemToTemplate,
} from '@/lib/workPlanTemplates';

/**
 * Save-mode Work Plan Library slide-over — pick a folder to save the selected
 * work items into. Browsing/adding happens in the Add Work Item pane instead.
 */
export default function WorkPlanTemplateLibraryModal({
  isOpen, onClose, itemsToSave = [], onSaved,
}) {
  const qc = useQueryClient();
  const [folderModal, setFolderModal] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const { data: folders = [] } = useQuery({
    queryKey: ['workPlanTemplateFolders'],
    queryFn: listTemplateFolders,
    enabled: isOpen,
  });

  const handleCreateFolder = async (name, color) => {
    await createTemplateFolder(name, color);
    setFolderModal(false);
    qc.invalidateQueries({ queryKey: ['workPlanTemplateFolders'] });
  };

  const handleSaveIntoFolder = async (folder) => {
    setBusyId(folder.id);
    await Promise.all(itemsToSave.map((o) => saveItemToTemplate(folder.id, o)));
    setBusyId(null);
    qc.invalidateQueries({ queryKey: ['workPlanTemplateItems', folder.id] });
    onSaved?.(folder);
    onClose();
  };

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={onClose}>
        <div className="h-full bg-white dark:bg-card shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <h2 className="text-base font-bold text-foreground truncate">Save to Work Plan Library</h2>
            <CloseButton onClick={onClose} />
          </div>

          <div className="px-5 pt-4 shrink-0 flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Pick a folder to save {itemsToSave.length} work item{itemsToSave.length === 1 ? '' : 's'} into.
            </p>
            <Button size="sm" onClick={() => setFolderModal(true)} className="shrink-0">
              <Plus className="w-4 h-4" /> Folder
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {folders.length === 0 ? (
              <div className="text-center py-10">
                <div className="flex justify-center grayscale opacity-60"><FolderIcon color="orange" size={40} /></div>
                <p className="text-sm font-medium text-foreground mt-3">No library folders yet</p>
                <p className="text-xs text-muted-foreground mt-1">Create a folder to start saving work items.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => handleSaveIntoFolder(f)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/20 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FolderIcon color={f.color || 'orange'} size={20} />
                      <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                    </div>
                    {busyId === f.id ? (
                      <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    ) : (
                      <span className="text-xs text-primary font-medium shrink-0">Save here</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t border-border flex items-center justify-end shrink-0">
            <Button variant="outline" onClick={onClose}>Close</Button>
          </div>
        </div>
      </SlidePane>

      <FolderFormModal
        isOpen={folderModal}
        mode="create"
        initialName=""
        initialColor="orange"
        onConfirm={handleCreateFolder}
        onCancel={() => setFolderModal(false)}
        overlayClassName="z-[110]"
      />
    </>
  );
}