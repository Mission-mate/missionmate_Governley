import React from 'react';
import { GripVertical } from 'lucide-react';
import CircleCheck from '@/components/shared/CircleCheck';

/** Leading control on a planner task: single-select circle, or a drag grip while the selected task is being moved. */
export default function RowSelector({ selected, moving, onToggle }) {
  if (selected && moving) {
    return (
      <span data-drag-now="" onClick={(e) => e.stopPropagation()} aria-label="Drag to reorder"
        className="w-5 h-5 shrink-0 grid place-items-center text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4" />
      </span>
    );
  }
  return <span onClick={(e) => e.stopPropagation()} className="shrink-0 flex"><CircleCheck checked={selected} onChange={onToggle} /></span>;
}