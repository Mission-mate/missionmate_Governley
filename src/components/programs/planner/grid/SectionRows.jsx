import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

/**
 * Renders one section's task rows as a drop target inside PlannerDragContext. While moving,
 * only the selected task is draggable and it can be dropped into any section.
 * Tasks lift on a 300 ms press (useLongPressSensor). renderRow(row) returns the row content.
 */
export default function SectionRows({ sectionId, rows, selectedId, moving, renderRow, className }) {
  return (
    <Droppable droppableId={sectionId}>
      {(dp) => (
        <div ref={dp.innerRef} {...dp.droppableProps}
          className={cn(className, moving && 'min-h-10 rounded-lg')}>
          {rows.map((r, i) => (
            <Draggable key={r.id} draggableId={r.id} index={i} isDragDisabled={moving && r.id !== selectedId}>
              {(d, s) => (
                <div ref={d.innerRef} {...d.draggableProps} {...d.dragHandleProps}>
                  <div className={cn('transition-[transform,box-shadow] duration-200 ease-out rounded-xl',
                    s.isDragging && 'scale-[1.03] -rotate-1 shadow-xl shadow-foreground/10 dark:shadow-black/50')}>
                    {renderRow(r)}
                  </div>
                </div>
              )}
            </Draggable>
          ))}
          {dp.placeholder}
        </div>
      )}
    </Droppable>
  );
}