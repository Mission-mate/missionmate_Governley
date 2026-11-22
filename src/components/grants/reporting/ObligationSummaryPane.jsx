import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import SlidePane from '@/components/ui/SlidePane';
import ObligationSummaryCard from './ObligationSummaryCard';
import CloseButton from '@/components/shared/CloseButton';

/** Right-side pane listing the obligations behind a clicked summary card. */
export default function ObligationSummaryPane({ summary, grants = [], onClose }) {
  const navigate = useNavigate();
  const items = summary?.obligations || [];
  // O(1) grant lookups — rebuilt only when the grants prop changes.
  const grantMap = useMemo(() => new Map(grants.map((g) => [g.id, g])), [grants]);

  return (
    <SlidePane isOpen={!!summary} onClose={onClose}>
      <div className="h-full bg-background border-l border-border flex flex-col">
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{summary?.title}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {items.length} item{items.length === 1 ? '' : 's'}
            </p>
          </div>
          <CloseButton onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {items.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No obligations in this category</div>
          ) : (
            items.map((ob) => (
              <ObligationSummaryCard
                key={ob.id}
                obligation={ob}
                grantName={ob.grant_title || grantMap.get(ob.grant_id)?.name}
                onOpen={(o) => o.grant_id && navigate(`/grants/${o.grant_id}?tab=reporting`)}
              />
            ))
          )}
        </div>
      </div>
    </SlidePane>
  );
}