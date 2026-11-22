import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLayerByLevel, MODULES } from '@/lib/strategyLayers';
import { useLevel2 } from '@/hooks/useLevel2';
import { blockOpenPath } from '@/lib/strategy/blockRoute';
import Level3DetailPane from '@/components/strategy/level3/Level3DetailPane';
import Level5DetailPane from '@/components/strategy/level5/Level5DetailPane';
import Level6DetailPane from '@/components/strategy/level6/Level6DetailPane';
import Level7DetailPane from '@/components/strategy/level7/Level7DetailPane';

/**
 * Overview tab detail pane — routes a selected block to the SAME per-level
 * detail pane used by that level's own tab, so the two views can never drift.
 * Always view-only: the Open action deep-links to the level's own tab, where
 * editing happens.
 */
export default function OverviewDetailPane({ block, strategy, blocks, onClose, onSaved }) {
  const navigate = useNavigate();
  const { level2 } = useLevel2(strategy?.id);
  const [expanded, setExpanded] = useState(false);

  if (!block) return null;

  const module = getLayerByLevel(strategy, block.level)?.module;
  const openInLevelTab = (item) => {
    onClose();
    navigate(blockOpenPath(strategy, item));
  };
  const common = { item: block, strategy, onClose, onSaved, viewOnly: true, onOpen: openInLevelTab };

  if (module === MODULES.PRIORITIES) {
    return <Level3DetailPane {...common} level2Items={level2} />;
  }
  if (module === MODULES.ACTIONS) {
    return <Level5DetailPane {...common} blocks={blocks} />;
  }
  if (module === MODULES.MEASURES) {
    return (
      <Level6DetailPane
        {...common}
        blocks={blocks}
        expanded={expanded}
        onToggleExpand={() => setExpanded((v) => !v)}
      />
    );
  }
  if (module === MODULES.ENABLERS) {
    return <Level7DetailPane {...common} />;
  }
  return null;
}