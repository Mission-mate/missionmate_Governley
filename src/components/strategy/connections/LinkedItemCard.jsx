import React from 'react';
import { X } from 'lucide-react';
import { levelLabel } from '@/lib/strategy';
import LevelIcon from './LevelIcon';

/** Linked "Contributes To" item card. Pass onUnlink to show the unlink control. */
export default function LinkedItemCard({ block, strategy, onUnlink, disabled }) {
  return (
    <div className="flex items-center gap-2.5 border border-border rounded-lg px-3 py-2.5">
      <LevelIcon level={block.level} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted-foreground">{levelLabel(strategy, block.level)}</p>
        <p className="text-sm font-medium text-foreground truncate">{block.title}</p>
      </div>
      {onUnlink &&
        <button
          onClick={onUnlink}
          disabled={disabled}
          className="p-1.5 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors shrink-0"
          title="Remove connection">
          <X className="w-4 h-4" />
        </button>
      }
    </div>
  );
}