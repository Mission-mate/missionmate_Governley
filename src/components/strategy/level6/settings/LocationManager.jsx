import React, { useState } from 'react';
import { Plus, Pencil, Trash2, Check, X, MapPin, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import DeleteCategoryDialog from './DeleteCategoryDialog';

/** Add / rename / delete / reorder the managed categories available in the reporting table. */
export default function LocationManager({ locations, onChange }) {
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onChange([...locations, { id: `loc_${Date.now()}`, name: trimmed }]);
    setName('');
  };

  const saveRename = (id) => {
    const trimmed = editText.trim();
    if (trimmed) onChange(locations.map((l) => l.id === id ? { ...l, name: trimmed } : l));
    setEditingId(null);
  };

  const remove = async (id) => {
    await onChange(locations.filter((l) => l.id !== id));
    setDeleteTarget(null);
  };

  const onDragEnd = (result) => {
    if (!result.destination || result.destination.index === result.source.index) return;
    const next = [...locations];
    const [moved] = next.splice(result.source.index, 1);
    next.splice(result.destination.index, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {if (e.key === 'Enter') add();}}
          placeholder="Category name..."
          className="h-9" />

        <Button onClick={add} disabled={!name.trim()} className="h-9 gap-1.5 shrink-0">
          <Plus className="w-4 h-4" /> Add
        </Button>
      </div>

      {locations.length === 0 ?
      <p className="border border-dashed border-border rounded-lg px-3 py-4 text-center text-xs text-[hsl(var(--muted-foreground))]">No categories yet. Categories you add here are added straight into the reporting table.

      </p> :

      <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="categories">
            {(dropProvided) =>
          <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="border border-border rounded-lg divide-y divide-border bg-card">
                {locations.map((l, index) =>
            <Draggable key={l.id} draggableId={l.id} index={index} isDragDisabled={editingId === l.id}>
                    {(dragProvided, snapshot) =>
              <div
                ref={dragProvided.innerRef}
                {...dragProvided.draggableProps}
                className={cn(
                  'flex items-center gap-2 px-3 py-2.5 bg-card',
                  snapshot.isDragging && 'rounded-lg border border-border shadow-lg'
                )}>

                        <span
                  {...dragProvided.dragHandleProps}
                  className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing shrink-0">
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {editingId === l.id ?
                <>
                            <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {if (e.key === 'Enter') saveRename(l.id);if (e.key === 'Escape') setEditingId(null);}}
                    className="h-7 text-sm"
                    autoFocus />

                            <button onClick={() => saveRename(l.id)} className="p-1 text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                          </> :

                <>
                            <span className="text-sm text-foreground flex-1 truncate">{l.name}</span>
                            <button onClick={() => {setEditingId(l.id);setEditText(l.name);}} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setDeleteTarget(l)} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </>
                }
                      </div>
              }
                  </Draggable>
            )}
                {dropProvided.placeholder}
              </div>
          }
          </Droppable>
        </DragDropContext>
      }

      <DeleteCategoryDialog
        isOpen={deleteTarget !== null}
        name={deleteTarget?.name || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => remove(deleteTarget.id)} />

    </div>);

}