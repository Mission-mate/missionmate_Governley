import React, { useState } from 'react';
import { GripVertical, Pencil, Trash2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ColorPicker from './ColorPicker';

/** One Level 2 pillar row — Manage Categories style with a colour swatch in front. */
export default function Level2Row({ item, count, onSave, onDelete, levelName }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color || 'blue');

  const save = () => {
    if (!name.trim()) return;
    onSave(item.id, { name: name.trim(), color });
    setEditing(false);
  };

  const cancel = () => {
    setName(item.name);
    setColor(item.color || 'blue');
    setEditing(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-white dark:bg-card">
      {editing ? (
        <>
          <ColorPicker value={color} onChange={setColor} />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            className="h-8"
            autoFocus
          />
          <button onClick={save} className="text-green-600 hover:text-green-700 p-1">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={cancel} className="text-muted-foreground hover:text-foreground p-1">
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <span className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab">
            <GripVertical className="w-4 h-4" />
          </span>
          <ColorPicker value={color} onChange={(c) => { setColor(c); onSave(item.id, { color: c }); }} />
          <span className="flex-1 text-sm font-medium text-foreground truncate">{item.name}</span>
          <span
            title={`${count} ${levelName} assigned`}
            className="text-[11px] text-muted-foreground bg-muted rounded-full px-2 py-0.5"
          >
            {count}
          </span>
          <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-primary p-1">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item)} className="text-muted-foreground hover:text-destructive p-1">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </>
      )}
    </div>
  );
}