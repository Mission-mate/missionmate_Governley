import React from 'react';
import { useNavigate } from 'react-router-dom';
import SlidePane from '@/components/ui/SlidePane';
import DrilldownItemCard from './DrilldownItemCard';
import CloseButton from '@/components/shared/CloseButton';

/** Right-side pane listing the tasks / milestones behind a clicked chart element. */
export default function TaskDrilldownPane({ drilldown, onClose }) {
  const navigate = useNavigate();
  const items = drilldown?.items || [];

  return (
    <SlidePane isOpen={!!drilldown} onClose={onClose}>
      <div className="h-full bg-background border-l border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{drilldown?.chartName}</h2>
            {drilldown?.guide && (
              <p className="text-xs text-muted-foreground mt-0.5">{drilldown.guide}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              {drilldown?.label}{drilldown?.label ? ' · ' : ''}{items.length} item{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No items in this group</div>
          ) : (
            items.map((item) => (
              <DrilldownItemCard
                key={item.id}
                item={item}
                onOpen={(t) => navigate(`/strategy/deliverables/${t.block_id}?tab=completion`)}
              />
            ))
          )}
        </div>
      </div>
    </SlidePane>
  );
}