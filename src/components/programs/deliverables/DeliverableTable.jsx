import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Pagination from '@/components/shared/Pagination';
import useRowReorder from '@/components/strategy/useRowReorder';
import DeliverableRow, { ROW_GRID } from './DeliverableRow';

const SURFACE = 'bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5';

/** Deliverables register table; grouping renders one card per group, paged across all rows. */
export default function DeliverableTable({ groups, config, color, columnLabel = 'Deliverables', selectedId, onSelect, onOpen, empty, reorderable, moveMode, onReorder }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const total = groups.reduce((s, g) => s + g.rows.length, 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // Reordering needs the full, ungrouped list on one page.
  const canReorder = reorderable && groups.length === 1 && totalPages === 1;
  const { order, onDragEnd } = useRowReorder(groups[0]?.rows || [], canReorder, onReorder);
  const safePage = Math.min(page, totalPages);
  useEffect(() => { setPage(1); }, [total, pageSize]);

  // Slice the flattened rows for this page, keeping each row in its group.
  const pagedGroups = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    const end = start + pageSize;
    let i = 0;
    return groups.map((g) => {
      const rows = g.rows.filter(() => { const keep = i >= start && i < end; i += 1; return keep; });
      return { ...g, rows };
    }).filter((g) => g.rows.length > 0);
  }, [groups, safePage, pageSize]);

  const gridStyle = { gridTemplateColumns: `auto 60fr 10fr 14fr 10fr${config.show_priority ? ' 10fr' : ''}${config.custom_columns.map(() => ' 14fr').join('')}` };
  const header = (
    <div style={gridStyle} className={cn(ROW_GRID, 'py-3 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide items-center')}>
      <span className="w-5" /><span>{columnLabel}</span><span>Health</span><span>Owner</span><span>Status</span>
      {config.show_priority && <span>Priority</span>}
      {config.custom_columns.map((c) => <span key={c.id} className="truncate">{c.title}</span>)}
    </div>
  );
  if (total === 0) return <div className={SURFACE}>{header}<div className="py-14 text-center text-sm text-muted-foreground">{empty}</div></div>;

  return (
    <div>
      <div className="content-enter space-y-4">
        {pagedGroups.map((g) => (
          <div key={g.key || 'all'} className={SURFACE}>
            {g.label && (
              <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
                <span className="text-sm font-semibold text-foreground">{g.label}</span>
                <span className="text-xs rounded-full px-1.5 py-0.5 font-medium bg-muted text-muted-foreground">{groups.find((x) => x.key === g.key)?.rows.length}</span>
              </div>
            )}
            {header}
            {canReorder ? (
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="deliverables">
                  {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                      {order.map((d, index) => {
                        const enabled = moveMode && selectedId === d.id;
                        return (
                          <Draggable key={d.id} draggableId={d.id} index={index} isDragDisabled={!enabled}>
                            {(p, snap) => (
                              <DeliverableRow d={d} config={config} gridStyle={gridStyle} color={color}
                                selected={selectedId === d.id} onSelect={onSelect} onOpen={onOpen}
                                drag={{ ...p, enabled, isDragging: snap.isDragging }} />
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            ) : g.rows.map((d) => (
              <DeliverableRow key={d.id} d={d} config={config} gridStyle={gridStyle} color={color}
                selected={selectedId === d.id} onSelect={onSelect} onOpen={onOpen} />
            ))}
          </div>
        ))}
      </div>
      <Pagination page={safePage} totalPages={totalPages} total={total} pageSize={pageSize}
        onPageChange={setPage} onPageSizeChange={setPageSize} />
    </div>
  );
}