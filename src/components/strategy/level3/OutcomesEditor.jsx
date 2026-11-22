import React, { useState } from 'react';
import { Plus, Check, Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

let seq = 0;
const newId = () => `oc_${Date.now()}_${seq++}`;

/** Add / edit / delete multiple outcomes — each shown in a muted pill with edit + delete. */
export default function OutcomesEditor({ outcomes = [], onChange, placeholder = 'e.g. 1,000 active volunteers by 2028' }) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const add = () => {
    if (!draft.trim()) return;
    onChange([...outcomes, { id: newId(), text: draft.trim() }]);
    setDraft('');
  };

  const saveEdit = (id) => {
    if (!editingText.trim()) return;
    onChange(outcomes.map((o) => (o.id === id ? { ...o, text: editingText.trim() } : o)));
    setEditingId(null);
  };

  const remove = (id) => onChange(outcomes.filter((o) => o.id !== id));

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="h-10"
        />
        <Button type="button" variant="outline" size="icon" className="h-10 w-10 shrink-0" onClick={add}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {outcomes.map((o) => (
        <div key={o.id} className="flex items-center gap-2 bg-muted/60 rounded-lg px-3 py-2">
          {editingId === o.id ? (
            <>
              <Input value={editingText} onChange={(e) => setEditingText(e.target.value)} className="h-8 flex-1" autoFocus />
              <button type="button" onClick={() => saveEdit(o.id)} className="text-green-600 p-1"><Check className="w-4 h-4" /></button>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 text-green-600 shrink-0" />
              <span className="flex-1 text-sm text-foreground">{o.text}</span>
              <button type="button" onClick={() => { setEditingId(o.id); setEditingText(o.text); }} className="text-muted-foreground hover:text-foreground p-1">
                <Pencil className="w-4 h-4" />
              </button>
              <button type="button" onClick={() => remove(o.id)} className="text-destructive hover:text-destructive/80 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}