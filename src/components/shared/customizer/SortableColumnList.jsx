import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

/**
 * Drag-to-reorder list of custom column cards, matching the asset customiser.
 * `renderCard(col, dragHandleProps)` renders each card; `onReorder(from, to)` saves the new order.
 */
export default function SortableColumnList({ droppableId, columns, onReorder, renderCard }) {
  const handleDragEnd = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    onReorder(source.index, destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId={droppableId}>
        {(drop) => (
          <div ref={drop.innerRef} {...drop.droppableProps}>
            {columns.map((col, index) => (
              <Draggable key={col.id} draggableId={col.id} index={index}>
                {(drag) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} className="pb-2">
                    {renderCard(col, drag.dragHandleProps)}
                  </div>
                )}
              </Draggable>
            ))}
            {drop.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}