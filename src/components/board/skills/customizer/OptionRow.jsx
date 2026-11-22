import React, { useState } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { X, Trash2, Pencil, Check, GripVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

// Single option row (skill or attribute option): drag handle, inline rename, delete.
export default function OptionRow({ option, index, onRename, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(option.name);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onRename(option.id, name.trim());
      setEditing(false);
    } catch (err) {
      setName(option.name);
      toast({ title: 'Could not rename the option', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Draggable draggableId={option.id} index={index}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps}
          className={cn('flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-background', snapshot.isDragging && 'shadow-lg ring-1 ring-primary/30')}>
          <span {...provided.dragHandleProps} className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0">
            <GripVertical className="w-4 h-4" />
          </span>
          {editing ? (
            <>
              <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} className="h-7 flex-1 text-sm" autoFocus />
              <button onClick={save} disabled={busy} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
              <button onClick={() => { setEditing(false); setName(option.name); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <span className="flex-1 text-sm text-foreground">{option.name}</span>
              <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(option)} disabled={busy} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
            </>
          )}
        </div>
      )}
    </Draggable>
  );
}