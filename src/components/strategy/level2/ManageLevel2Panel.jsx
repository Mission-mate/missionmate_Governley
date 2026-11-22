import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { createLevel2, updateLevel2, deleteLevel2, LEVEL2_COLOR_KEYS } from '@/lib/strategyLevel2';
import { LEVELS } from '@/lib/strategyLayers';
import ColorPicker from './ColorPicker';
import Level2Row from './Level2Row';
import DeleteLevel2Dialog from './DeleteLevel2Dialog';

/** Manage strategic themes — add, rename, recolour and delete pillars. */
export default function ManageLevel2Panel({ strategyId, levelName, items = [], blocks = [], onChanged, onDirtyChange }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [deleting, setDeleting] = useState(null);
  const pending = !!name.trim();
  useEffect(() => { onDirtyChange?.(pending); }, [pending]);
  useEffect(() => () => onDirtyChange?.(false), []);

  // Priority count per theme for the assignment badge.
  const counts = useMemo(() => {
    const map = {};
    blocks.filter((b) => b.level === LEVELS.PRIORITIES).forEach((b) => {
      if (b.level2_id) map[b.level2_id] = (map[b.level2_id] || 0) + 1;
    });
    return map;
  }, [blocks]);

  const add = async () => {
    if (!name.trim()) return;
    await createLevel2({ strategy_id: strategyId, name: name.trim(), color, order_index: items.length });
    setName('');
    setColor(LEVEL2_COLOR_KEYS[(items.length + 1) % LEVEL2_COLOR_KEYS.length]);
    onChanged();
  };

  const save = async (id, data) => {
    await updateLevel2(id, data);
    onChanged();
  };

  const confirmDelete = async () => {
    await deleteLevel2(deleting.id);
    toast({ title: `${deleting.name} deleted` });
    setDeleting(null);
    onChanged();
  };

  return (
    <>
      <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-2">
        <div className="flex items-center gap-2">
          <ColorPicker value={color} onChange={setColor} />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={`New ${levelName.toLowerCase()} name`}
          />
          <Button onClick={add} disabled={!name.trim()}>
            <Plus className="w-4 h-4" /> Add
          </Button>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            <Layers className="w-8 h-8 mx-auto mb-2 text-muted-foreground/40" />
            No {levelName.toLowerCase()} yet
          </div>
        ) : (
          <div className="space-y-1.5">
            {items.map((item) => (
              <Level2Row
                key={item.id}
                item={item}
                count={counts[item.id] || 0}
                levelName={levelName}
                onSave={save}
                onDelete={setDeleting}
              />
            ))}
          </div>
        )}
      </div>

      <DeleteLevel2Dialog
        isOpen={!!deleting}
        item={deleting}
        count={deleting ? counts[deleting.id] || 0 : 0}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}