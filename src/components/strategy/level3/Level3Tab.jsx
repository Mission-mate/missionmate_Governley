import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { levelLabel } from '@/lib/strategy';
import { LEVELS } from '@/lib/strategyLayers';
import { deleteBlock, reorderBlocks } from '@/lib/strategy';
import useInitialOpen from '@/components/strategy/useInitialOpen';
import StrategyLevelSummaryCards from '@/components/strategy/StrategyLevelSummaryCards';
import Level3Table from './Level3Table';
import Level3DetailPane from './Level3DetailPane';
import AddLevel3Modal from './AddLevel3Modal';
import DeleteStrategyRowsDialog from '../selection/DeleteStrategyRowsDialog';
import useRowSelection from '@/components/strategy/selection/useRowSelection';
import StrategySelectionLayer from '@/components/strategy/selection/StrategySelectionLayer';

/** Level 3 workspace tab — table, add/edit modal, detail pane and delete flow. */
export default function Level3Tab({ strategy, blocks, level2Items, addOpen, onCloseAdd, onRefresh, initialOpenId }) {
  const { toast } = useToast();
  const [openItem, setOpenItem] = useState(null);
  useInitialOpen(initialOpenId, blocks, setOpenItem);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [openEditing, setOpenEditing] = useState(false);
  const selection = useRowSelection();

  const levelName = levelLabel(strategy, LEVELS.PRIORITIES);
  const level2Name = levelLabel(strategy, LEVELS.THEME);

  // Keep the open pane in sync after a save.
  const current = openItem ? blocks.find((b) => b.id === openItem.id) || null : null;

  const handleDelete = async () => {
    await deleteBlock(deleteItem.id);
    toast({ title: `${deleteItem.title} deleted` });
    setDeleteItem(null);
    setOpenItem(null);
    onRefresh();
  };

  return (
    <div>
      <StrategyLevelSummaryCards blocks={blocks} level={LEVELS.PRIORITIES} levelName={levelName} />

      <Level3Table
        strategy={strategy}
        blocks={blocks}
        level2Items={level2Items}
        onOpen={(b) => { selection.clear(); setOpenEditing(false); setOpenItem(b); }}
        onReorder={async (ordered) => { await reorderBlocks(ordered); onRefresh(); }}
        selectedIds={selection.selectedIds}
        onToggleSelect={selection.toggle}
        moveMode={selection.moveMode}
      />

      <StrategySelectionLayer
        selection={selection}
        blocks={blocks}
        noun={levelName}
        onView={(i) => { setOpenEditing(false); setOpenItem(i); }}
        onEdit={(i) => { setOpenEditing(true); setOpenItem(i); }}
        onRefresh={onRefresh}
      />

      <AddLevel3Modal
        isOpen={addOpen || !!editItem}
        onClose={() => { onCloseAdd(); setEditItem(null); }}
        onSaved={onRefresh}
        strategyId={strategy.id}
        levelName={levelName}
        level2Name={level2Name}
        level2Items={level2Items}
        block={editItem}
      />

      <Level3DetailPane
        item={current}
        strategy={strategy}
        level2Items={level2Items}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
        startEditing={openEditing}
        onClose={() => { setOpenItem(null); setExpanded(false); setOpenEditing(false); }}
        onSaved={onRefresh}
        onDelete={(item) => { setDeleteItem(item); setOpenItem(null); setExpanded(false); }}
      />

      <DeleteStrategyRowsDialog
        isOpen={!!deleteItem}
        item={deleteItem}
        noun={levelName}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}