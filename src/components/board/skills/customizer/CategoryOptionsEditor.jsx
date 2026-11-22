import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import OptionRow from './OptionRow';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { toast } from '@/components/ui/use-toast';

/**
 * Options list for one category. `api` adapts the storage layer:
 * { options, create(name), rename(id, name), remove(id), reorder(ids) }
 * Skills use boardSkills.js; attribute categories use boardCategories.js.
 */
export default function CategoryOptionsEditor({ category, api, onChanged }) {
  const [ordered, setOrdered] = useState(api.options);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  useEffect(() => { setOrdered(api.options); }, [api.options]);

  const add = async () => {
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await api.create(newName.trim());
      setNewName('');
      onChanged();
    } catch (err) {
      toast({ title: 'Could not add the option', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = Array.from(ordered);
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    setOrdered(next);
    try {
      await api.reorder(next.map((o) => o.id));
      onChanged();
    } catch {
      setOrdered(api.options);
      toast({ title: 'Could not save the new order', description: 'Please try again.', variant: 'destructive' });
    }
  };

  return (
    <div className="px-3 pb-3 pt-1 space-y-2">
      <div className="flex items-center gap-2">
        <Input value={newName} onChange={(e) => setNewName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} placeholder={`Add ${category.name.toLowerCase()} option...`} className="h-8 flex-1 text-sm" />
        <Button onClick={add} disabled={!newName.trim() || adding} size="sm" variant="outline"><Plus className="w-4 h-4" /> Add</Button>
      </div>
      {ordered.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No options yet.</p>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`options-${category.id}`}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-1.5">
                {ordered.map((o, i) => <OptionRow key={o.id} option={o} index={i} onRename={async (id, n) => { await api.rename(id, n); onChanged(); }} onDelete={setPendingDelete} />)}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      <ConfirmDeleteDialog
        isOpen={!!pendingDelete}
        title="Delete Option"
        message={`Delete "${pendingDelete?.name}"? It will be removed from every committee member it is assigned to.`}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          try {
            await api.remove(pendingDelete.id);
            setPendingDelete(null);
            onChanged();
          } catch {
            toast({ title: 'Could not delete the option', description: 'Please try again.', variant: 'destructive' });
          }
        }}
      />
    </div>
  );
}