import React, { useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StrategyTableToolbar from '../StrategyTableToolbar';
import useBlockTableView from '../useBlockTableView';
import { cn } from '@/lib/utils';
import { levelLabel } from '@/lib/strategy';
import { healthStyle } from '../level3/health';
import { statusStyle, priorityStyle } from '../priority';
import OwnerAvatarList from '../OwnerAvatarList';
import { parseOwners } from '@/lib/strategy/ownerUtils';
import LevelIcon from '../connections/LevelIcon';
import useRowReorder from '../useRowReorder';
import RowSelectCircle from '../selection/RowSelectCircle';
import { LEVELS } from '@/lib/strategyLayers';
import LevelExportDialogHost from '../overview/LevelExportDialogHost';
import HealthCapsuleTabs from '../HealthCapsuleTabs';
import GroupCardHeader from '../GroupCardHeader';
import { showPriority, getTableCustomColumns, customValue, customFieldEntries } from '@/lib/strategy/levelFields';
import { BLOCK_FIELDS } from '@/lib/strategy/blockTableView';
import StrategyCustomCell from '../customFields/StrategyCustomCell';

const GRID = 'grid gap-3 px-5';

/** Level 6 records table — rows open the detail pane; grouping renders one card per group. */
export default function Level6Table({ strategy, blocks, onOpen, onReorder, selectedIds, onToggleSelect, moveMode, level = LEVELS.MEASURES, leftSlot = null }) {
  const levelName = levelLabel(strategy, level);
  const showPrio = showPriority(strategy, level);
  const customCols = useMemo(() => getTableCustomColumns(strategy, level), [strategy?.level_field_config, level]);
  const fields = useMemo(() => [...BLOCK_FIELDS, ...customFieldEntries(customCols)], [customCols]);
  // Status keeps a fixed minimum so its longest label ("Not Started") stays on one line; the title column yields the space.
  const gridStyle = { gridTemplateColumns: `auto 70fr 10fr minmax(6.5rem, 10fr)${showPrio ? ' 10fr' : ''}${customCols.map(() => ' 14fr').join('')}` };

  const view = useBlockTableView(blocks, level, levelName, fields, customCols);
  const { rows, canReorder, groupBy, sectionsFor, toolbarProps, healthFilter, setHealthFilter, healthCounts } = view;
  const { order, onDragEnd } = useRowReorder(rows, canReorder, onReorder);
  const sections = sectionsFor(order);
  const grouped = !!groupBy;

  const headerRow = (
    <div style={gridStyle} className={cn(GRID, 'py-3 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide items-center')}>
      <span className="w-4" />
      <span>{levelName}</span>
      <span>Health</span>
      <span>Status</span>
      {showPrio && <span>Priority</span>}
      {customCols.map((c) => <span key={c.id} className="truncate">{c.title}</span>)}
    </div>
  );

  const renderRows = (list) => list.map((b) => {
    const index = order.indexOf(b);
    const hs = healthStyle(b.health);
    const dragEnabled = canReorder && moveMode && selectedIds.size === 1 && selectedIds.has(b.id);
    const linked = blocks.find((x) => x.id === b.contributes_to);
    return (
      <Draggable key={b.id} draggableId={b.id} index={index} isDragDisabled={!dragEnabled}>
        {(dragProvided, snapshot) => (
          <div
            ref={dragProvided.innerRef}
            {...dragProvided.draggableProps}
            className={cn('border-b border-border last:border-b-0 bg-card', snapshot.isDragging && 'shadow-lg rounded-lg border')}>

            <div
              onClick={() => onOpen(b)}
              style={gridStyle}
              className={cn('w-full', GRID, 'py-3 items-center cursor-pointer hover:bg-sidebar-accent/70 transition-colors', selectedIds.has(b.id) && 'bg-primary/10 hover:bg-primary/10')}>

              <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <RowSelectCircle checked={selectedIds.has(b.id)} onChange={() => onToggleSelect(b.id)} />
                <span
                  {...dragProvided.dragHandleProps}
                  className={cn('text-muted-foreground/50 hover:text-muted-foreground', dragEnabled ? 'cursor-grab active:cursor-grabbing' : 'hidden')}
                  title="Drag to reorder">
                  <GripVertical className="w-4 h-4" />
                </span>
              </span>
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="shrink-0"><LevelIcon level={level} size="reg" /></span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-medium">{b.title}</p>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap text-[11px] text-muted-foreground">
                    {b.custom_id &&
                      <>
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-semibold">
                          ID: {b.custom_id}
                        </span>
                        <span>·</span>
                      </>
                    }
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">Owner:</span> <OwnerAvatarList owners={parseOwners(b)} />
                    </span>
                    <span>·</span>
                    <span>
                      <span className="font-semibold">Contributes To:</span>{' '}
                      {linked ?
                        <span className="font-normal text-muted-foreground">{linked.title}</span> :
                        <span className="italic">None linked</span>}
                    </span>
                  </div>
                </div>
              </div>
              {b.health ?
                <span className={cn('text-sm font-semibold', hs.text)}>{b.health}</span> :
                <span className="text-sm text-muted-foreground">—</span>}
              <span>
                {b.status ?
                  <span className={cn('inline-flex w-fit items-center whitespace-nowrap text-xs font-medium rounded-full px-2.5 py-0.5', statusStyle(b.status))}>
                    {b.status}
                  </span> :
                  <span className="text-sm text-muted-foreground">—</span>}
              </span>
              {showPrio && (
                <span>
                  {b.priority ?
                    <span className={cn('inline-flex w-fit items-center text-xs font-medium rounded-full px-2.5 py-0.5', priorityStyle(b.priority))}>
                      {b.priority}
                    </span> :
                    <span className="text-sm text-muted-foreground">—</span>}
                </span>
              )}
              {customCols.map((c) => (
                <span key={c.id} className="min-w-0">
                  <StrategyCustomCell column={c} value={customValue(b, c.id)} />
                </span>
              ))}
            </div>
          </div>
        )}
      </Draggable>);
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 justify-between flex-wrap">
        <HealthCapsuleTabs value={healthFilter} onChange={setHealthFilter} counts={healthCounts} />
        {leftSlot}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <StrategyTableToolbar {...toolbarProps} />
        </div>
      </div>

      <LevelExportDialogHost view={view} order={order} selectedIds={selectedIds} level={level} />

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
          {headerRow}
          <div className="py-14 text-center text-sm text-muted-foreground">
            No {levelName.toLowerCase()} records yet. Click "Add {levelName}" to create one.
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId={`level-${level}-rows`}>
            {(dropProvided) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={grouped ? 'content-enter space-y-5' : 'content-enter bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5'}>
                {!grouped && headerRow}
                {sections.map((section) => grouped ? (
                  <div key={section.label || 'all'}>
                    <GroupCardHeader label={section.label} count={section.rows.length} />
                    <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
                      {headerRow}
                      {renderRows(section.rows)}
                    </div>
                  </div>
                ) : (
                  <div key={section.label || 'all'}>{renderRows(section.rows)}</div>
                ))}
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>);
}