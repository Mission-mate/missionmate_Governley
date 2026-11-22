import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export default function AddCategoryForm({ onAdd }) {
  const [name, setName] = useState('');
  const [cardinality, setCardinality] = useState('multi');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onAdd({ name: name.trim(), cardinality });
      setName('');
    } catch (err) {
      toast({ title: 'Could not add the category', description: err?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-dashed border-border p-3 space-y-2">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Category</p>
      <div className="flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="e.g., Age Group" className="h-9 flex-1" />
        <div className="flex rounded-md border border-input overflow-hidden text-xs font-medium">
          {['single', 'multi'].map((c) => (
            <button key={c} onClick={() => setCardinality(c)} className={cn('px-2.5 h-9 capitalize transition-colors', cardinality === c ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-primary/10')}>{c}</button>
          ))}
        </div>
        <Button onClick={submit} disabled={!name.trim() || busy} size="sm"><Plus className="w-4 h-4" /> Add</Button>
      </div>
    </div>
  );
}