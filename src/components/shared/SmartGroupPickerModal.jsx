import React, { useState } from 'react';
import { Trash2, LayoutGrid, X } from 'lucide-react';
import { LoaderOne } from '@/components/ui/loaders';
import ModalOverlay from '@/components/ui/ModalOverlay';
import { Button } from '@/components/ui/button';
import CircleSelector from '@/components/shared/export/CircleSelector';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { useSmartLists } from '@/hooks/useSmartLists';
import { useToast } from '@/components/ui/use-toast';

/**
 * Shared centre-screen Smart Group picker used by Contacts and Members.
 * Selection is local until Apply; Clear removes the active group.
 *
 * @param objectType  Smart group scope, e.g. 'contacts' | 'members'
 * @param activeId    Currently applied smart group id (or null)
 * @param onApply     Called with the chosen smart group record
 * @param onClear     Called when the user clears the active group
 * @param countFilters Optional (filters) => number, for the per-row filter count
 */
export default function SmartGroupPickerModal({
  isOpen, onClose, objectType, activeId, onApply, onClear, countFilters,
}) {
  const { toast } = useToast();
  const { smartLists, isLoading, deleteSmartList } = useSmartLists(objectType);
  const [selectedId, setSelectedId] = useState(activeId || null);
  const [pendingDelete, setPendingDelete] = useState(null);

  // Re-sync the local selection each time the modal is opened.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setSelectedId(activeId || null);
  }

  const confirmDelete = async () => {
    const group = pendingDelete;
    await deleteSmartList(group.id);
    setPendingDelete(null);
    if (selectedId === group.id) setSelectedId(null);
    if (activeId === group.id) onClear();
    toast({ title: 'Smart group deleted', description: `"${group.name}" removed.` });
  };

  const handleApply = () => {
    const group = smartLists.find((g) => g.id === selectedId);
    if (group) onApply(group);
    onClose();
  };

  const handleClear = () => {
    setSelectedId(null);
    onClear();
    onClose();
  };

  return (
    <>
      <ModalOverlay isOpen={isOpen} onClose={onClose}>
        <div className="w-[440px] max-w-[92vw] bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-start gap-3 p-6 pb-4">
            <LayoutGrid className="w-6 h-6 text-primary shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-bold text-foreground font-heading">Smart Group</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Select a Smart Group to filter this list.</p>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 pb-4 max-h-[320px] overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <LoaderOne size="sm" />
              </div>
            ) : smartLists.length === 0 ? (
              <p className="px-6 py-10 text-sm text-muted-foreground text-center">
                No Smart Groups yet. Use Filter to choose criteria, then save as a Smart Group.
              </p>
            ) : (
              <div className="space-y-1">
                {smartLists.map((group) => {
                  const count = countFilters ? countFilters(group.filters || {}) : 0;
                  return (
                    <div
                      key={group.id}
                      onClick={() => setSelectedId(group.id)}
                      className="group flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer hover:bg-accent transition-colors"
                    >
                      <CircleSelector checked={selectedId === group.id} />
                      <span className="text-sm font-medium text-foreground truncate flex-1">{group.name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {count} filter{count !== 1 ? 's' : ''}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); setPendingDelete(group); }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0"
                        title="Delete Smart Group"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-border">
            <Button variant="outline" onClick={handleClear}>Clear</Button>
            <Button onClick={handleApply} disabled={!selectedId}>Apply</Button>
          </div>
        </div>
      </ModalOverlay>

      <ConfirmDeleteDialog
        isOpen={!!pendingDelete}
        title="Delete Smart Group"
        message={
          <>
            This will permanently remove <strong className="text-foreground">{pendingDelete?.name}</strong> from your Smart Groups.
          </>
        }
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </>
  );
}