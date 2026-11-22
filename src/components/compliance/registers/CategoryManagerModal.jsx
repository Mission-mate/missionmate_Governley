import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { X, Plus, Pencil, Trash2, Check, Loader2, FolderOpen, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ModalOverlay from '@/components/ui/ModalOverlay';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { registerCategoryStore, PROTECTED_CATEGORY } from '@/lib/complianceRegisters';
import CloseButton from '@/components/shared/CloseButton';

export default function CategoryManagerModal({ isOpen, onClose, categories, registers, onChanged, store = registerCategoryStore, noun = 'registers' }) {
  const { addCategory, renameCategory, removeCategory, saveCategories } = store;
  const [list, setList] = useState([]);
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (isOpen) { setList(categories); setNewName(''); setEditing(null); }
  }, [isOpen, categories]);

  const countFor = (cat) => registers.filter((r) => (r.category || '') === cat).length;

  const handleAdd = guardSave(setBusy, async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const next = await addCategory(newName);
    setList(next); setNewName(''); setBusy(false);
    onChanged();
  });

  const handleRename = guardSave(setBusy, async () => {
    if (!editing?.value.trim()) return;
    setBusy(true);
    const next = await renameCategory(editing.name, editing.value);
    setList(next); setEditing(null); setBusy(false);
    onChanged();
  });

  const handleRemove = guardSave(setBusy, async () => {
    setBusy(true);
    const next = await removeCategory(deleteTarget.name);
    setList(next); setBusy(false); setDeleteTarget(null);
    onChanged();
  });

  const handleDragEnd = guardSave(setBusy, async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(list);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setList(next);
    setBusy(true);
    // A failed save puts the saved order back before the error is reported.
    await saveCategories(next).catch((e) => { setList(list); throw e; });
    setBusy(false);
    onChanged();
  });

  // Categories save instantly; only an unsubmitted new name or in-progress rename can be lost.
  const guard = useUnsavedChanges({
    draft: { newName: newName.trim(), rename: editing && editing.value !== editing.name ? editing.value : '' },
    baseline: { newName: '', rename: '' },
    onClose,
    saving: busy,
    enabled: isOpen,
  });

  return (
    <ModalOverlay isOpen={isOpen} onClose={guard.requestClose} className="w-full max-w-md">
      <div className="bg-card rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">Manage Categories</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Manage categories to organise {noun}</p>
          </div>
          <CloseButton onClick={() => guard.requestClose()} />
        </div>

        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground">Create categories to organise {noun}</p>
          <div className="flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="New category name"
            />
            <Button onClick={handleAdd} disabled={busy || !newName.trim()}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>

          {list.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
              No categories yet
            </div>
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="compliance-register-categories">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                    {list.map((cat, index) => {
                      const count = countFor(cat);
                      const isEditing = editing?.name === cat;
                      return (
                        <Draggable key={cat} draggableId={cat} index={index} isDragDisabled={isEditing}>
                          {(dp, snapshot) => (
                            <div
                              ref={dp.innerRef}
                              {...dp.draggableProps}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                            >
                              {isEditing ? (
                                <>
                                  <Input
                                    value={editing.value}
                                    onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                    className="h-8"
                                    autoFocus
                                  />
                                  <button onClick={handleRename} disabled={busy} className="text-green-600 hover:text-green-700 p-1">
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground p-1">
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <span {...dp.dragHandleProps} className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                                    <GripVertical className="w-4 h-4" />
                                  </span>
                                  <span className="flex-1 text-sm font-medium text-foreground">{cat}</span>
                                  <span className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{count}</span>
                                  <button onClick={() => setEditing({ name: cat, value: cat })} className="text-muted-foreground hover:text-primary p-1">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setDeleteTarget({ name: cat, count })}
                                    disabled={busy || cat === PROTECTED_CATEGORY}
                                    title={cat === PROTECTED_CATEGORY ? 'Governance cannot be deleted' : 'Delete category'}
                                    className="text-muted-foreground hover:text-destructive p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
          {busy && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Loader2 className="w-3 h-3 animate-spin" /> Updating...</div>}
        </div>

        <div className="flex items-center justify-end px-6 py-4 border-t border-border">
          <Button variant="outline" onClick={() => guard.requestClose()}>Done</Button>
        </div>
      </div>

      <ConfirmTypeDialog
        isOpen={!!deleteTarget}
        title="Delete Category"
        message={
          deleteTarget?.count
            ? `"${deleteTarget.name}" has ${deleteTarget.count} register${deleteTarget.count === 1 ? '' : 's'}. Deleting it will move ${deleteTarget.count === 1 ? 'it' : 'them'} to the Governance category.`
            : `This will permanently delete the "${deleteTarget?.name}" category.`
        }
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={handleRemove}
        onClose={() => setDeleteTarget(null)}
        overlayClassName="z-[60]"
      />
      {guard.dialog}
    </ModalOverlay>
  );
}