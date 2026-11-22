import React from 'react';
import { useNavigate } from 'react-router-dom';
import { levelLabel, reorderBlocks } from '@/lib/strategy';
import StrategyLevelSummaryCards from '@/components/strategy/StrategyLevelSummaryCards';
import Level6Table from './Level6Table';
import AddLevel6Modal from './AddLevel6Modal';
import useRowSelection from '@/components/strategy/selection/useRowSelection';
import StrategySelectionLayer from '@/components/strategy/selection/StrategySelectionLayer';
import { LEVELS } from '@/lib/strategyLayers';

/** Projects/Programs and Measures workspace tab — rows open the record's full page. */
export default function Level6Tab({ strategy, blocks, addOpen, onCloseAdd, onRefresh, level = LEVELS.MEASURES }) {
  const navigate = useNavigate();
  const selection = useRowSelection();
  const openPage = (item) => navigate(`/strategy/deliverables/${item.id}`);
  const levelName = levelLabel(strategy, level);

  return (
    <div>
      <StrategyLevelSummaryCards blocks={blocks} level={level} levelName={levelName} />

      <Level6Table
        strategy={strategy}
        level={level}
        blocks={blocks}
        onOpen={(b) => { selection.clear(); openPage(b); }}
        onReorder={async (ordered) => { await reorderBlocks(ordered); onRefresh(); }}
        selectedIds={selection.selectedIds}
        onToggleSelect={selection.toggle}
        moveMode={selection.moveMode}
      />

      <StrategySelectionLayer
        selection={selection}
        blocks={blocks}
        noun={levelName}
        onView={openPage}
        onEdit={openPage}
        onRefresh={onRefresh}
      />

      <AddLevel6Modal
        isOpen={addOpen}
        onClose={onCloseAdd}
        onSaved={onRefresh}
        strategyId={strategy.id}
        level={level}
        levelName={levelName}
      />
    </div>
  );
}