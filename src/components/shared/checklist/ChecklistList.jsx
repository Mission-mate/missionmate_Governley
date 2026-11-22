import React, { useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { localToday } from '@/lib/localClock';
import ChecklistRow from './ChecklistRow';
import ChecklistQuickAdd from './ChecklistQuickAdd';

/**
 * Checklist body shared by every module's task/subtask tab. Items are ordered by status, then order_index.
 * statuses: [{ value }], getStatus(item). Move mode drags only the selected row; emits the new id order.
 * onCreate(fields, status) — status is the active filter, or the first status on "All".
 */
export default function ChecklistList({ items, statuses, getStatus, filter, readOnly, selectedId, onToggleSelect, onOpen, moving, onReorder, onCreate, emptyLabel = 'No tasks yet' }) {
  const rank = (s) => statuses.findIndex((x) => x.value === s);
  const list = useMemo(() => items
    .filter((t) => filter === 'all' || getStatus(t) === filter)
    .sort((a, b) => rank(getStatus(a)) - rank(getStatus(b)) || (a.order_index ?? 0) - (b.order_index ?? 0)
      || String(a.created_date || '').localeCompare(String(b.created_date || ''))), [items, filter]); // eslint-disable-line

  const today = localToday();
  const rowProps = (t) => {
    const status = getStatus(t);
    return { item: t, status, overdue: !!t.due_date && t.due_date < today && status !== 'Completed' };
  };

  const onDragEnd = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    const ids = list.map((t) => t.id);
    const [moved] = ids.splice(source.index, 1);
    ids.splice(destination.index, 0, moved);
    onReorder(ids);
  };

  return (
    <div className="content-enter">
      {list.length === 0 && <p className="px-6 py-6 text-sm text-muted-foreground">{emptyLabel}</p>}
      {moving ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="checklist">
            {(drop) => (
              <div ref={drop.innerRef} {...drop.droppableProps}>
                {list.map((t, index) => (
                  <Draggable key={t.id} draggableId={t.id} index={index} isDragDisabled={t.id !== selectedId}>
                    {(p, snap) => {
                      const row = (
                        <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                          <ChecklistRow {...rowProps(t)} moving={t.id === selectedId} dragging={snap.isDragging} selected={t.id === selectedId} onToggleSelect={onToggleSelect} onOpen={() => {}} />
                        </div>
                      );
                      // Portal while dragging so transformed slide-over parents don't offset the row.
                      return snap.isDragging ? createPortal(row, document.body) : row;
                    }}
                  </Draggable>
                ))}
                {drop.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : list.map((t) => (
        <ChecklistRow key={t.id} {...rowProps(t)} onOpen={onOpen} selectable={!readOnly} selected={t.id === selectedId} onToggleSelect={onToggleSelect} />
      ))}
      {!readOnly && !moving && <ChecklistQuickAdd key={filter} statuses={statuses} defaultStatus={filter === 'all' ? statuses[0].value : filter} onSubmit={onCreate} />}
    </div>
  );
}