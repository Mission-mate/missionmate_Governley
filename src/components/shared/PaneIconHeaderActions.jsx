/**
 * PaneIconHeaderActions — minimal icon-only Edit + Close pair for right-side panes.
 * Matches the plain icon style of the Overview view pane (no labels, no pill, no filled circle).
 */
import React from 'react';
import { SquarePen, ExternalLink } from 'lucide-react';
import CloseButton from '@/components/shared/CloseButton';

export default function PaneIconHeaderActions({ onEdit, onClose, showEdit = true, onOpen }) {
  return (
    <div className="flex items-center shrink-0 gap-0.5">
      {onOpen && (
        <button
          onClick={onOpen}
          title="Open"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent text-muted-foreground hover:text-foreground border-0 hover:bg-muted transition-[background-color] duration-[120ms]"
        >
          <ExternalLink className="w-4 h-4" strokeWidth={1.8} strokeLinecap="round" />
        </button>
      )}
      {showEdit && !onOpen && (
        <button
          onClick={onEdit}
          title="Edit"
          className="w-8 h-8 rounded-lg flex items-center justify-center bg-transparent text-muted-foreground hover:text-foreground border-0 hover:bg-muted transition-[background-color] duration-[120ms]"
        >
          <SquarePen className="w-4 h-4" strokeWidth={1.8} strokeLinecap="round" />
        </button>
      )}
      <CloseButton onClick={onClose} />
    </div>
  );
}