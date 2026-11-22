import CloseButton from '@/components/shared/CloseButton';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, FolderOpen, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import FolderFormModal from '@/components/documents/FolderFormModal';
import FolderIcon from '@/components/documents/FolderIcon';
import FolderRowMenu from './FolderRowMenu';
import LibraryItemCard from './LibraryItemCard';
import LoaderOne from '@/components/ui/loaders/LoaderOne';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';
import {
  listTemplateFolders, createTemplateFolder, updateTemplateFolder, deleteTemplateFolder,
  listTemplateObligations, deleteTemplateObligation,
} from '@/lib/complianceTemplates';
/** One folder row that expands inline to reveal its library items (view & remove). */
function LibraryFolderRow({ folder, onRename, onDelete, onRemoveItem, busyId }) {
  const [open, setOpen] = useState(false);
  const reveal = useCollapse(open);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['complianceTemplateObligations', folder.id],
    queryFn: () => listTemplateObligations(folder.id),
    enabled: open,
  });

  return (
    <div className="rounded-xl border border-border">
      <div className={cn('flex items-center justify-between gap-2 pr-2 hover:bg-muted/40 transition-colors rounded-xl', open && 'rounded-b-none')}>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2.5 px-3 py-2.5 min-w-0 flex-1 text-left"
        >
          <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', open && 'rotate-90')} />
          <FolderIcon color={folder.color || 'orange'} size={20} />
          <span className="text-sm font-medium text-foreground truncate">{folder.name}</span>
        </button>
        <FolderRowMenu onRename={onRename} onDelete={onDelete} />
      </div>

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
                action="remove"
                busy={busyId === item.id}
                onRemove={() => onRemoveItem(item)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Shared Compliance Library management pane — opened from the Compliance Calendar
 * home page. Folders can be created, renamed and deleted, and library items can be
 * removed. Items cannot be added to a register from here (that happens inside a
 * register's "Add Obligation → Add from Library" flow).
 */
export default function ComplianceLibraryPane({ isOpen, onClose }) {
  const qc = useQueryClient();
  const [folderModal, setFolderModal] = useState(null); // { mode: 'create'|'edit', folder? }
  const [deleteFolderTarget, setDeleteFolderTarget] = useState(null);
  const [removeItemTarget, setRemoveItemTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data: folders = [], isLoading: foldersLoading } = useQuery({
    queryKey: ['complianceTemplateFolders'],
    queryFn: listTemplateFolders,
    enabled: isOpen,
  });

  const invalidateFolders = () => qc.invalidateQueries({ queryKey: ['complianceTemplateFolders'] });
  const invalidateItems = (fid) => qc.invalidateQueries({ queryKey: ['complianceTemplateObligations', fid] });

  const handleClose = () => { setFolderModal(null); onClose(); };

  const handleFolderSubmit = async (name, color) => {
    if (folderModal?.mode === 'edit') {
      await updateTemplateFolder(folderModal.folder.id, { name, color });
    } else {
      await createTemplateFolder(name, color);
    }
    setFolderModal(null);
    invalidateFolders();
  };

  const handleDeleteFolder = async () => {
    await deleteTemplateFolder(deleteFolderTarget.id);
    setDeleteFolderTarget(null);
    invalidateFolders();
  };

  const handleRemoveItem = async () => {
    const fid = removeItemTarget.folder_id;
    setBusyId(removeItemTarget.id);
    try {
      await deleteTemplateObligation(removeItemTarget.id);
    } catch (err) {
      if (!String(err?.message || '').includes('not found')) throw err;
    } finally {
      setBusyId(null);
      setRemoveItemTarget(null);
      if (fid) invalidateItems(fid);
    }
  };

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={handleClose}>
        <div className="h-full bg-card shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground truncate">Compliance Library</h2>
              <CloseButton onClick={handleClose} className="shrink-0" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Organise and reuse recurring compliance obligations across compliance calendars.
            </p>
          </div>

          {/* Toolbar row — folder create action */}
          <div className="px-5 pt-4 shrink-0 flex justify-end">
            <Button size="sm" onClick={() => setFolderModal({ mode: 'create' })}>
              <Plus className="w-4 h-4" /> Compliance Folder
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {foldersLoading ? (
              <div className="flex items-center justify-center min-h-[200px]">
                <LoaderOne />
              </div>
            ) : folders.length === 0 ? (
              <div className="text-center py-10">
                <div className="flex justify-center grayscale opacity-60"><FolderIcon color="orange" size={40} /></div>
                <p className="text-sm font-medium text-foreground mt-3">No library folders yet</p>
                <p className="text-xs text-muted-foreground mt-1">Use “Compliance Folder” above to create one.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {folders.map((f) => (
                  <LibraryFolderRow
                    key={f.id}
                    folder={f}
                    busyId={busyId}
                    onRename={() => setFolderModal({ mode: 'edit', folder: f })}
                    onDelete={() => setDeleteFolderTarget(f)}
                    onRemoveItem={(item) => setRemoveItemTarget(item)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-end shrink-0">
            <Button variant="outline" onClick={handleClose}>Close</Button>
          </div>
        </div>
      </SlidePane>

      <ConfirmTypeDialog
        isOpen={!!deleteFolderTarget}
        title="Delete Folder"
        message={`Permanently delete "${deleteFolderTarget?.name}" and all templates inside it?`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDeleteFolder}
        onClose={() => setDeleteFolderTarget(null)}
        overlayClassName="z-[110]"
      />

      <ConfirmTypeDialog
        isOpen={!!removeItemTarget}
        title="Remove Library Item"
        message={`Remove "${removeItemTarget?.title?.slice(0, 50) || 'this item'}" from the library? Registers that already added it are not affected.`}
        keyword="REMOVE"
        confirmLabel="Remove"
        onConfirm={handleRemoveItem}
        onClose={() => setRemoveItemTarget(null)}
        overlayClassName="z-[110]"
      />

      <FolderFormModal
        isOpen={!!folderModal}
        mode={folderModal?.mode || 'create'}
        initialName={folderModal?.folder?.name || ''}
        initialColor={folderModal?.folder?.color || 'orange'}
        onConfirm={handleFolderSubmit}
        onCancel={() => setFolderModal(null)}
        overlayClassName="z-[110]"
      />
    </>
  );
}