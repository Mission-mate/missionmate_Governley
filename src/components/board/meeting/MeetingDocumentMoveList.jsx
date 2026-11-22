import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import MeetingDocumentRow from './MeetingDocumentRow';

/**
 * Full meeting document list in move mode: only the selected document can be
 * dragged; dropping it calls onReorder with the new ordered list.
 */
export default function MeetingDocumentMoveList({ docs, selectedId, rowProps, onReorder }) {
  const handleDragEnd = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    const next = [...docs];
    const [moved] = next.splice(source.index, 1);
    next.splice(destination.index, 0, moved);
    onReorder(next);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="meeting-documents">
        {(drop) => (
          <div ref={drop.innerRef} {...drop.droppableProps}>
            {docs.map((doc, index) => (
              <Draggable key={doc.id} draggableId={doc.id} index={index} isDragDisabled={doc.id !== selectedId}>
                {(drag, snapshot) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} className="pb-3">
                    <MeetingDocumentRow
                      {...rowProps}
                      doc={doc}
                      selected={doc.id === selectedId}
                      moving
                      dragHandleProps={drag.dragHandleProps}
                      isDragging={snapshot.isDragging}
                    />
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