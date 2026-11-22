import React, { useState } from 'react';
import { Lock, Pencil, Trash2, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** One credential type row: locked system type, or editable custom type. */
export default function CredentialTypeRow({ name, locked, startEditing, onRename, onDelete }) {
  const [editing, setEditing] = useState(!!startEditing);
  const [text, setText] = useState(name);
  const commit = () => { const v = text.trim(); if (v) { onRename(v); setEditing(false); } };
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 min-h-[46px]">
      {editing ? (
        <Input autoFocus value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commit()}
          placeholder="Credential type name" className="h-8 flex-1" />
      ) : <span className="flex-1 text-sm font-medium text-foreground truncate">{name}</span>}
      {locked ? <Lock className="w-4 h-4 text-muted-foreground" title="System credential" /> : (
        <>
          {editing
            ? <button onClick={commit} title="Done" className="text-muted-foreground hover:text-foreground"><Check className="w-4 h-4" /></button>
            : <button onClick={() => setEditing(true)} title="Rename" className="text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>}
          <button onClick={onDelete} title="Delete" className="text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
        </>
      )}
    </div>
  );
}