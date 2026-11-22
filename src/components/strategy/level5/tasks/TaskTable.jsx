import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import CircleCheck from '@/components/shared/CircleCheck';
import TaskRow from './TaskRow';
import SectionRow from './SectionRow';
import TaskGroupHeader from './TaskGroupHeader';
import TaskHeaderLabel from './TaskHeaderLabel';

const ROOT = 'root';
const byOrder = (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0);

const grip = (dragHandleProps) => (
  <button {...dragHandleProps} onClick={(e) => e.stopPropagation()} className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
    <GripVertical className="w-4 h-4" />
  </button>
);

/**
 * Top-level task + milestone table for one Level 5 record (subtasks live in the side pane).
 * Top-level rows show a single-select ring when `onToggleSelect` is given;
 * drag-reordering is only enabled while `moving`.
 */
export default function TaskTable({ tasks, columns: allColumns, viewResult, readOnly = false, header = null, onOpen, onReorder, onReorderSections, selectedId = null, onToggleSelect, moving = false, collapsedIds = new Set(), onToggleCollapse }) {
  // Owner is shown inline under the name instead of as its own column.
  const columns = useMemo(() => allColumns.filter((c) => c.key !== 'owner'), [allColumns]);
  const sections = useMemo(() => tasks.filter((t) => t.type === 'section').sort(byOrder), [tasks]);
  const topLevel = useMemo(
    () => tasks.filter((t) => t.type !== 'section').sort(byOrder),
    [tasks]
  );
  const itemsIn = (sectionId) => topLevel.filter((t) => (t.section_id || '') === (sectionId === ROOT ? '' : sectionId));
  // Move mode is scoped to the selection: the selected row, or every row in the selected section.
  const canDrag = !readOnly && moving;
  const canDragItem = (t) => canDrag && (t.id === selectedId || (!!t.section_id && t.section_id === selectedId));
  const canDragSection = (sec) => canDrag && sec.id === selectedId;

  const ring = (t) => (onToggleSelect ? (
    <CircleCheck checked={selectedId === t.id} onChange={() => onToggleSelect(t.id)} />
  ) : null);

  const COL_WIDTH = {
    start_date: 'minmax(72px,0.495fr)',
    due_date: 'minmax(72px,0.495fr)',
    owner: 'minmax(100px,0.7fr)',
    health: 'minmax(75px,0.4fr)',
    status: 'minmax(95px,0.5fr)',
    priority: 'minmax(75px,0.4fr)',
    progress: 'minmax(95px,0.5fr)',
  };
  const grid = {
    gridTemplateColumns: `24px minmax(236px,2.11fr) ${columns
      .map((c) => COL_WIDTH[c.key] || 'minmax(90px,0.5fr)')
      .join(' ')}`.trim(),
  };

  const handleDragEnd = (result) => {
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === 'SECTION') {
      if (source.index === destination.index) return;
      const reordered = Array.from(sections);
      const [moved] = reordered.splice(source.index, 1);
      reordered.splice(destination.index, 0, moved);
      onReorderSections(reordered);
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    const from = Array.from(itemsIn(source.droppableId));
    const [moved] = from.splice(source.index, 1);
    if (source.droppableId === destination.droppableId) {
      from.splice(destination.index, 0, moved);
      onReorder(from, source.droppableId === ROOT ? '' : source.droppableId);
    } else {
      const to = Array.from(itemsIn(destination.droppableId));
      to.splice(destination.index, 0, moved);
      const targetId = destination.droppableId === ROOT ? '' : destination.droppableId;
      onReorder(from, source.droppableId === ROOT ? '' : source.droppableId);
      onReorder(to, targetId);
    }
  };

  const renderTask = (p, idx) => (
    <Draggable key={p.id} draggableId={p.id} index={idx} isDragDisabled={!canDragItem(p)}>
      {(dp, snapshot) => (
        <div ref={dp.innerRef} {...dp.draggableProps} className={cn(snapshot.isDragging && 'shadow-lg bg-card rounded-lg')}>
          <TaskRow
            task={p}
            grid={grid}
            columns={columns}
            onOpen={moving ? null : onOpen}
            readOnly={readOnly}
            selected={selectedId === p.id}
            dragHandle={canDragItem(p) ? grip(dp.dragHandleProps) : ring(p)}
          />
        </div>
      )}
    </Draggable>
  );

  const renderList = (droppableId, emptyHint) => (
    <Droppable droppableId={droppableId} type="TASK">
      {(provided) => (
        <div ref={provided.innerRef} {...provided.droppableProps}>
          {itemsIn(droppableId).map(renderTask)}
          {provided.placeholder}
          {emptyHint && moving && itemsIn(droppableId).length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground border-b border-border">{emptyHint}</div>
          )}
        </div>
      )}
    </Droppable>
  );

  const isEmpty = topLevel.length === 0 && sections.length === 0;

  // Grouped / filtered / sorted view — flat, non-draggable list.
  const staticRow = (t) => (
    <TaskRow key={t.id} task={t} grid={grid} columns={columns} onOpen={onOpen} readOnly={readOnly} selected={selectedId === t.id} dragHandle={ring(t)} />
  );

  return (
    <div className="content-enter bg-card border border-border rounded-lg overflow-x-auto">
      {header}
      <div style={grid} className="grid items-center gap-2 px-4 py-2.5 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide">
        <span />
        <span className="truncate">Name</span>
        {columns.map((c) => (
          <TaskHeaderLabel key={c.kind === 'custom' ? c.id : c.key} columnKey={c.kind === 'custom' ? null : c.key} label={c.label || c.title} />
        ))}
      </div>
      {isEmpty ? (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {readOnly ? 'No tasks yet.' : 'No tasks yet. Click "Add Milestone" to create one.'}
        </div>
      ) : viewResult?.active ? (
        viewResult.rows.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No tasks match the current filters.</div>
        ) : viewResult.groups ? (
          viewResult.groups.map((g) => (
            <div key={g.label}>
              <TaskGroupHeader label={g.label} count={g.rows.length} />
              {g.rows.map(staticRow)}
            </div>
          ))
        ) : (
          viewResult.rows.map(staticRow)
        )
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          {renderList(ROOT)}
          <Droppable droppableId="sections" type="SECTION">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {sections.map((sec, idx) => (
                  <Draggable key={sec.id} draggableId={sec.id} index={idx} isDragDisabled={!canDragSection(sec)}>
                    {(dp, snapshot) => (
                      <div ref={dp.innerRef} {...dp.draggableProps} className={cn(snapshot.isDragging && 'shadow-lg rounded-lg overflow-hidden')}>
                        <SectionRow
                          section={sec}
                          onOpen={onOpen}
                          readOnly={readOnly || moving}
                          control={canDragSection(sec) ? grip(dp.dragHandleProps) : ring(sec)}
                          collapsed={!moving && collapsedIds.has(sec.id)}
                          onToggleCollapse={moving ? undefined : () => onToggleCollapse(sec.id)}
                          milestoneCount={itemsIn(sec.id).filter((t) => t.type === 'milestone').length}
                          taskCount={itemsIn(sec.id).filter((t) => t.type !== 'milestone').length}
                        />
                        <AnimatePresence initial={false}>
                          {!(collapsedIds.has(sec.id) && !moving) && (
                            <motion.div
                              key="rows"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: moving ? 0 : 0.2, ease: 'easeOut' }}
                              className={cn(!moving && 'overflow-hidden')}
                            >
                              {renderList(sec.id, 'Drag tasks here to group them under this section.')}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}