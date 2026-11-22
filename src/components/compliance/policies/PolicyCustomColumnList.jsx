import React from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import CustomColumnCard from '@/components/strategy/customizer/CustomColumnCard';

/** Reorderable custom-column list with eye (table visibility), edit and delete controls. `fc` = useFieldCustomiser result. */
export default function PolicyCustomColumnList({ fc, onAdd }) {
  const columns = fc.draft.custom;
  const onDragEnd = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    fc.reorderColumns(source.index, destination.index);
  };
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Columns</p>
        <Button variant="outline" size="sm" onClick={onAdd} disabled={!!fc.editingId} className="shrink-0"><Plus className="w-3.5 h-3.5" /> Add Column</Button>
      </div>
      <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">Custom fields support full editing.</p>
      {columns.length === 0 ? (
        <div className="rounded-lg bg-muted/40 px-4 py-4 text-sm text-muted-foreground text-center">No custom columns yet. Use "+ Add Column" to create one.</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="policy-custom-columns">
            {(drop) => (
              <div ref={drop.innerRef} {...drop.droppableProps}>
                {columns.map((col, index) => (
                  <Draggable key={col.id} draggableId={col.id} index={index}>
                    {(drag) => (
                      <div ref={drag.innerRef} {...drag.draggableProps} className="pb-2">
                        <CustomColumnCard col={col} dragHandleProps={drag.dragHandleProps}
                          savedCol={fc.saved.custom.find((c) => c.id === col.id)}
                          onUpdate={fc.updateColumn}
                          onSetVisible={(v) => fc.setColumnVisible(col.id, v)}
                          onRemove={() => fc.removeColumn(col.id)} />
                      </div>
                    )}
                  </Draggable>
                ))}
                {drop.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}