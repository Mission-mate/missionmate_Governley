import React, { useState } from 'react';
import { ChevronDown, Lock, Pencil, Trash2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import useCollapse from '@/hooks/useCollapse';
import CategoryOptionsEditor from './CategoryOptionsEditor';
import { toast } from '@/components/ui/use-toast';

// Category card: header row (expand, rename, cardinality, lock/delete) + collapsible options editor.
export default function CategoryRow({ category, api, expanded, onToggle, onRename, onCardinality, onDelete, onChanged }) {
  const reveal = useCollapse(expanded);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);

  const save = async () => {
    if (!name.trim()) return;
    try {
      await onRename(category, name.trim());
      setEditing(false);
    } catch (err) {
      setName(category.name);
      toast({ title: 'Could not rename the category', description: err?.message || 'Please try again.', variant: 'destructive' });
    }
  };

  return (
        <div className="rounded-xl border border-border bg-[hsl(var(--muted))]">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <button onClick={onToggle} className="text-muted-foreground hover:text-foreground shrink-0">
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', expanded && 'rotate-180')} />
            </button>
            {editing ? (
              <>
                <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} className="h-8 flex-1" autoFocus />
                <button onClick={save} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
                <button onClick={() => { setEditing(false); setName(category.name); }} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <button onClick={onToggle} className="flex-1 text-left text-sm font-medium text-foreground">{category.name}</button>
                {category.kind !== 'skills' && (
                  <button onClick={() => onCardinality(category)} title="Toggle single / multi select"
                    className="text-[10px] font-semibold uppercase tracking-wide px-2 h-5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    {category.cardinality === 'single' ? 'Single' : 'Multi'}
                  </button>
                )}
                {category.is_locked ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/60" title="System category" />
                ) : (
                  <>
                    <button onClick={() => setEditing(true)} className="text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => onDelete(category)} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                  </>
                )}
              </>
            )}
          </div>
          {reveal.mounted && (
            <div className={reveal.className}>
              <CategoryOptionsEditor category={category} api={api} onChanged={onChanged} />
            </div>
          )}
        </div>
  );
}