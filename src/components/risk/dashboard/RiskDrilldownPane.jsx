import React from 'react';
import { useNavigate } from 'react-router-dom';
import SlidePane from '@/components/ui/SlidePane';
import RatingBadge from '@/components/risk/RatingBadge';
import CloseButton from '@/components/shared/CloseButton';
import { ExternalLink } from 'lucide-react';

/**
 * Shared right-hand drill-down pane for the Risk Dashboard charts.
 * Shows the matching risks as cards (title, description, category, owner).
 */
export default function RiskDrilldownPane({ isOpen, onClose, title, subtitle, badge, risks = [] }) {
  const navigate = useNavigate();

  return (
    <SlidePane isOpen={isOpen} onClose={onClose}>
      <div className="h-full bg-card border-l border-border flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
              {badge}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <CloseButton onClick={onClose} className="shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {risks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">No risks to show.</p>
          ) : (
            risks.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/risk/register/${r.id}`)}
                className="relative w-full text-left rounded-2xl bg-muted p-4 hover:bg-accent transition-colors"
              >
                <ExternalLink className="absolute top-3 right-3 w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground pr-7">{r.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.risk_id ? `${r.risk_id} · ` : ''}{r.owner || 'Unassigned'}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <RatingBadge rating={r.residual_rating} />
                  {r.category && (
                    <span className="text-[11px] text-muted-foreground bg-card rounded-full px-2.5 py-1 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                      {r.category}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground bg-card rounded-full px-2.5 py-1 shadow-[0_1px_2px_rgba(16,24,40,0.05)]">
                    Owner: {r.owner || 'Unassigned'}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </SlidePane>
  );
}