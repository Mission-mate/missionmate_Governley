import React from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import useLongPressSensor from './useLongPressSensor';

const SENSORS = [useLongPressSensor];

/**
 * One drag context spanning every section so the selected task can be dropped into
 * any section. rowsFor(sectionId) returns the rows rendered in that section's list.
 * onReorder(rows, sectionId) persists a section's resulting order (and membership).
 */
export default function PlannerDragContext({ rowsFor, onReorder, children }) {
  const onDragEnd = ({ source, destination }) => {
    if (!destination) return;
    const from = source.droppableId, to = destination.droppableId;
    if (from === to && destination.index === source.index) return;
    const src = [...rowsFor(from)];
    const [moved] = src.splice(source.index, 1);
    if (from === to) {
      src.splice(destination.index, 0, moved);
      onReorder(src, to);
      return;
    }
    const dest = [...rowsFor(to)];
    dest.splice(destination.index, 0, moved);
    onReorder(src, from);
    onReorder(dest, to);
  };
  return <DragDropContext onDragEnd={onDragEnd} enableDefaultSensors={false} sensors={SENSORS}>{children}</DragDropContext>;
}