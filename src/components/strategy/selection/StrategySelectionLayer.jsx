import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { updateBlock, deleteBlocks } from '@/lib/strategy';
import StrategySelectionBar from './StrategySelectionBar';
import DeleteStrategyRowsDialog from './DeleteStrategyRowsDialog';

/**
 * Wires the strategy row selection state to its actions (view, edit, health,
 * move, delete). Shared by every level tab so behaviour stays identical.
 */
export default function StrategySelectionLayer({ selection, blocks, noun, onView, onEdit, onRefresh }) {
  const { toast } = useToast();
  const { ids, clear, moveMode, setMoveMode } = selection;
  const [deleteOpen, setDeleteOpen] = useState(false);

  const items = ids.map((id) => blocks.find((b) => b.id === id)).filter(Boolean);
  const single = items.length === 1 ? items[0] : null;

  const changeHealth = async (health) => {
    await Promise.all(items.map((i) => updateBlock(i.id, { health })));
    toast({ title: `Health set to ${health}`, description: `${items.length} record${items.length === 1 ? '' : 's'} updated` });
    clear();
    onRefresh();
  };

  const confirmDelete = async () => {
    await deleteBlocks(items.map((i) => i.id));
    toast({ title: `${items.length} ${noun.toLowerCase()}${items.length === 1 ? '' : 's'} deleted` });
    setDeleteOpen(false);
    clear();
    onRefresh();
  };

  return (
    <>
      <StrategySelectionBar
        count={items.length}
        moveMode={moveMode}
        onView={() => { if (single) { onView(single); clear(); } }}
        onEdit={() => { if (single) { onEdit(single); clear(); } }}
        onChangeHealth={changeHealth}
        onToggleMove={() => setMoveMode((v) => !v)}
        onDelete={() => setDeleteOpen(true)}
        onClear={clear}
      />

      <DeleteStrategyRowsDialog
        isOpen={deleteOpen}
        count={items.length}
        noun={noun}
        onClose={() => setDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </>
  );
}