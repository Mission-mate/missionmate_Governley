import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { levelLabel, deleteBlock, reorderBlocks } from '@/lib/strategy';
import useInitialOpen from '@/components/strategy/useInitialOpen';
import StrategyLevelSummaryCards from '@/components/strategy/StrategyLevelSummaryCards';
import Level7Table from './Level7Table';
import Level7DetailPane from './Level7DetailPane';
import AddLevel7Modal from './AddLevel7Modal';
import DeleteStrategyRowsDialog from '../selection/DeleteStrategyRowsDialog';
import useRowSelection from '@/components/strategy/selection/useRowSelection';
import StrategySelectionLayer from '@/components/strategy/selection/StrategySelectionLayer';
import { LEVELS } from '@/lib/strategyLayers';

/** Level 7 workspace tab — table, add/edit modal, detail pane and delete flow. */
export default function Level7Tab({ strategy, blocks, addOpen, onCloseAdd, onRefresh, initialOpenId, level = LEVELS.ENABLERS }) {
  const { toast } = useToast();
  const [openItem, setOpenItem] = useState(null);
  useInitialOpen(initialOpenId, blocks, setOpenItem);
  const [deleteItem, setDeleteItem] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [openEditing, setOpenEditing] = useState(false);
  const selection = useRowSelection();

  const levelName = levelLabel(strategy, level);
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
      <StrategyLevelSummaryCards blocks={blocks} level={level} levelName={levelName} />

      <Level7Table
        strategy={strategy}
        level={level}
        blocks={blocks}
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

      <AddLevel7Modal
        isOpen={addOpen}
        onClose={onCloseAdd}
        onSaved={onRefresh}
        strategyId={strategy.id}
        level={level}
        levelName={levelName}
      />

      <Level7DetailPane
        item={current}
        strategy={strategy}
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