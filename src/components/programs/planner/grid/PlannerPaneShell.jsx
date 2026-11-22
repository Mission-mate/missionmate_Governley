import React from 'react';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import CloseButton from '@/components/shared/CloseButton';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { cn } from '@/lib/utils';

/**
 * Shared right-side pane frame: view mode shows Edit icon + guide text; edit mode shows footer actions.
 * While `saving`, every dismissal route (outside click, Escape, close button) is blocked.
 * `tabs` sits under the title; `flush` gives the body edge-to-edge layout.
 */
export default function PlannerPaneShell({
  isOpen, onClose, saving, title, editing, onEdit, footer, children, extra,
  tabs, flush = false, showFooter = editing,
}) {
  const close = () => { if (!saving) onClose(); };
  return (
    <SlidePane isOpen={isOpen} onClose={close}>
      {extra}
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground truncate">{title}</h2>
            <div className={cn(saving && 'pointer-events-none opacity-40')}>
              {editing || !onEdit ? <CloseButton onClick={close} /> : <PaneIconHeaderActions onEdit={onEdit} showEdit onClose={close} />}
            </div>
          </div>
          {onEdit && <ViewModeHint className="mt-1.5" editing={editing} />}
          {tabs && <div className="mt-4">{tabs}</div>}
        </div>
        <fieldset disabled={saving} className={cn('flex-1 min-w-0 min-h-0', flush ? 'flex' : 'overflow-y-auto px-5 py-4 space-y-4')}>{children}</fieldset>
        {showFooter && footer && <div className="px-5 py-4 border-t border-border flex items-center gap-3 shrink-0">{footer}</div>}
      </div>
    </SlidePane>
  );
}