import CloseButton from '@/components/shared/CloseButton';
import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, FolderOpen, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SlidePane from '@/components/ui/SlidePane';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import FolderFormModal from '@/components/documents/FolderFormModal';
import FolderIcon from '@/components/documents/FolderIcon';
import FolderRowMenu from './FolderRowMenu';
import {
  listTemplateFolders, createTemplateFolder, updateTemplateFolder, deleteTemplateFolder,
  listTemplateObligations, deleteTemplateObligation, saveObligationToTemplate,
  applyTemplateToRegister, isTemplateInRegister,
} from '@/lib/complianceTemplates';

/**
 * Template Library right slide-over pane.
 * mode="browse"  → open folders, Add obligations to the current register.
 * mode="save"    → pick a folder to save the provided obligations into.
 */
export default function TemplateLibraryModal({
  isOpen, onClose, mode = 'browse',
  register, registerObligations = [], obligationsToSave = [],
  onApplied, onSaved,
}) {
  const qc = useQueryClient();
  const [openFolder, setOpenFolder] = useState(null);
  const [folderModal, setFolderModal] = useState(null); // { mode: 'create'|'edit', folder? }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const { data: folders = [] } = useQuery({
    queryKey: ['complianceTemplateFolders'],
    queryFn: listTemplateFolders,
    enabled: isOpen,
  });

  const { data: folderItems = [] } = useQuery({
    queryKey: ['complianceTemplateObligations', openFolder?.id],
    queryFn: () => listTemplateObligations(openFolder.id),
    enabled: isOpen && !!openFolder,
  });

  const invalidateFolders = () => qc.invalidateQueries({ queryKey: ['complianceTemplateFolders'] });
  const invalidateItems = (fid) => qc.invalidateQueries({ queryKey: ['complianceTemplateObligations', fid] });

  const reset = () => { setOpenFolder(null); setFolderModal(null); };
  const handleClose = () => { reset(); onClose(); };

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
    await deleteTemplateFolder(deleteTarget.id);
    setDeleteTarget(null);
    if (openFolder?.id === deleteTarget.id) setOpenFolder(null);
    invalidateFolders();
  };

  // Save mode: save all provided obligations into the chosen folder
  const handleSaveIntoFolder = async (folder) => {
    setBusyId(folder.id);
    await Promise.all(obligationsToSave.map((o) => saveObligationToTemplate(folder.id, o)));
    setBusyId(null);
    invalidateItems(folder.id);
    onSaved?.(folder);
    handleClose();
  };

  // Browse mode: add a template obligation to the current register
  const handleAdd = async (template) => {
    setBusyId(template.id);
    await applyTemplateToRegister(template, register, registerObligations);
    setBusyId(null);
    onApplied?.();
  };

  const handleDeleteTemplateItem = async (item) => {
    if (busyId === item.id) return; // ignore repeat clicks
    setBusyId(item.id);
    try {
      await deleteTemplateObligation(item.id);
    } catch (err) {
      // Item already removed — ignore "not found", surface anything else
      if (!String(err?.message || '').includes('not found')) throw err;
    } finally {
      setBusyId(null);
      invalidateItems(openFolder.id);
    }
  };

  const isSaveMode = mode === 'save';

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={handleClose}>
        <div className="h-full bg-card shadow-2xl flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {openFolder && (
                <button onClick={() => setOpenFolder(null)} className="text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-bold text-foreground truncate">
                {openFolder ? openFolder.name : 'Template Library'}
              </h2>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <CloseButton onClick={handleClose} />
            </div>
          </div>

          {/* Toolbar row — folder create action sits below the header divider */}
          {!openFolder && !isSaveMode && (
            <div className="px-5 pt-4 shrink-0 flex justify-end">
              <Button size="sm" onClick={() => setFolderModal({ mode: 'create' })}>
                <Plus className="w-4 h-4" /> Compliance Folder
              </Button>
            </div>
          )}

          {/* Save-mode banner */}
          {isSaveMode && !openFolder && (
            <div className="px-5 pt-4 shrink-0">
              <p className="text-sm text-muted-foreground">
                Pick a folder to save {obligationsToSave.length} obligation{obligationsToSave.length === 1 ? '' : 's'} into.
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
            {/* FOLDER LIST */}
            {!openFolder && (
              <div className="space-y-2">
                {folders.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="flex justify-center grayscale opacity-60"><FolderIcon color="orange" size={40} /></div>
                    <p className="text-sm font-medium text-foreground mt-3">No template folders yet</p>
                    <p className="text-xs text-muted-foreground mt-1">Use “Compliance Folder” above to start saving obligations.</p>
                  </div>
                ) : (
                  folders.map((f) => (
                    <div
                      key={f.id}
                      onClick={() => (isSaveMode ? handleSaveIntoFolder(f) : setOpenFolder(f))}
                      className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border border-border hover:bg-muted/40 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FolderIcon color={f.color || 'orange'} size={20} />
                        <span className="text-sm font-medium text-foreground truncate">{f.name}</span>
                      </div>
                      {isSaveMode ? (
                        busyId === f.id ? (
                          <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                        ) : (
                          <span className="text-xs text-primary font-medium shrink-0">Save here</span>
                        )
                      ) : (
                        <FolderRowMenu
                          onRename={() => setFolderModal({ mode: 'edit', folder: f })}
                          onDelete={() => setDeleteTarget(f)}
                        />
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* FOLDER CONTENTS (browse mode only) */}
            {openFolder && (
              <div className="animate-expand-enter space-y-2">
                {folderItems.length === 0 ? (
                  <div className="text-center py-10">
                    <FolderOpen className="w-9 h-9 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-foreground">This folder is empty</p>
                    <p className="text-xs text-muted-foreground mt-1">Save obligations from a register to fill it.</p>
                  </div>
                ) : (
                  folderItems.map((item) => {
                    const added = isTemplateInRegister(item, registerObligations);
                    return (
                      <div key={item.id} className="px-3 py-2.5 rounded-xl border border-border">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-foreground min-w-0 flex-1 break-words">{item.title}</p>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant={added ? 'outline' : 'default'}
                              disabled={added || busyId === item.id}
                              onClick={() => handleAdd(item)}
                              className="h-7 px-2.5 text-xs"
                            >
                              {busyId === item.id ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                              ) : added ? (
                                <><Check className="w-3.5 h-3.5" /> Added</>
                              ) : (
                                <><Plus className="w-3.5 h-3.5" /> Add</>
                              )}
                            </Button>
                            <button
                              onClick={() => handleDeleteTemplateItem(item)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {(item.category || item.regulator) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                            {item.category && <span><span className="text-muted-foreground/60">Category:</span> {item.category}</span>}
                            {item.category && item.regulator && <span className="text-muted-foreground/40">·</span>}
                            {item.regulator && <span><span className="text-muted-foreground/60">Regulator:</span> {item.regulator}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Footer — pinned close button */}
          <div className="px-5 py-4 border-t border-border flex items-center justify-end shrink-0">
            <Button variant="outline" onClick={handleClose}>Close</Button>
          </div>
        </div>
      </SlidePane>

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Folder"
        message={`Permanently delete "${deleteTarget?.name}" and all templates inside it?`}
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleDeleteFolder}
        onClose={() => setDeleteTarget(null)}
        overlayClassName="z-[110]"
      />

      {/* Create / Edit folder modal (name + colour) — stays as center modal */}
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