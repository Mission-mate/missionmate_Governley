import React from 'react';
import { Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import CanvasFieldRow from './CanvasFieldRow';

/**
 * The form being built. Shows every placed field (enabled) in order, compact and
 * expandable, with drag-to-reorder. Empty state prompts the admin to add a question.
 */
export default function FormCanvas({ canvasFields, plans = [], customFields = [], onEdit, onRemove, onReorder, onAddQuestion }) {
  const handleDragEnd = (result) => {
    if (!result.destination || !onReorder) return;
    onReorder(result.source.index, result.destination.index);
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto">
        <div className="bg-card border-0 rounded-2xl shadow-sm p-4 min-h-[320px]">
          {canvasFields.length === 0 ?
          <div className="flex flex-col items-center justify-center text-center py-16 border-2 border-dashed border-border rounded-xl">
              <Plus className="w-8 h-8 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-semibold text-foreground">Add your first question</p>
              <p className="text-xs text-muted-foreground mt-1 mb-4">Build your membership form one question at a time.</p>
              {onAddQuestion &&
            <Button type="button" size="sm" onClick={onAddQuestion} className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add Question
                </Button>
            }
            </div> :

          <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="form-canvas">
                {(provided) =>
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {canvasFields.map((f, index) =>
                <Draggable key={f.field_id} draggableId={f.field_id} index={index}>
                        {(prov) =>
                  <div ref={prov.innerRef} {...prov.draggableProps}>
                            <CanvasFieldRow
                      field={f}
                      plans={plans}
                      customFields={customFields}
                      onEdit={onEdit}
                      onRemove={() => onRemove(f)}
                      dragHandleProps={prov.dragHandleProps} />
                    
                          </div>
                  }
                      </Draggable>
                )}
                    {provided.placeholder}
                  </div>
              }
              </Droppable>
            </DragDropContext>
          }

          {canvasFields.length > 0 && onAddQuestion &&
          <div className="pt-4">
              <Button type="button" onClick={onAddQuestion} className="w-full gap-1.5">
                <Plus className="w-4 h-4" /> Add Question
              </Button>
            </div>
          }
        </div>
      </div>
    </div>);

}