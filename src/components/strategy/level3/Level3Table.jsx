import React, { useMemo } from 'react';
import { GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import StrategyTableToolbar from '../StrategyTableToolbar';
import useBlockTableView from '../useBlockTableView';
import { levelLabel, levelEnabled } from '@/lib/strategy';
import { LEVELS } from '@/lib/strategyLayers';
import Level2Badge from './Level2Badge';
import { healthStyle } from './health';
import InitialsAvatar from '../InitialsAvatar';
import OwnerAvatarList from '../OwnerAvatarList';
import { parseOwners } from '@/lib/strategy/ownerUtils';
import { cn } from '@/lib/utils';
import LevelIcon from '../connections/LevelIcon';
import useRowReorder from '../useRowReorder';
import RowSelectCircle from '../selection/RowSelectCircle';
import LevelExportDialogHost from '../overview/LevelExportDialogHost';
import HealthCapsuleTabs from '../HealthCapsuleTabs';
import GroupCardHeader from '../GroupCardHeader';
import { getTableCustomColumns, customValue, customFieldEntries } from '@/lib/strategy/levelFields';
import StrategyCustomCell from '../customFields/StrategyCustomCell';

// Group / Filter fields relevant to this level only — keeps the shared BLOCK_FIELDS untouched.
const LEVEL3_FIELDS = [
{ key: 'health', label: 'Health' },
{ key: 'owner', label: 'Owner' },
{ key: 'executive_sponsor', label: 'Executive Sponsor' }];


const GRID = 'grid gap-3 px-5';
// Long names wrap onto a second line instead of truncating.
const WRAP_NAME = 'items-center [&>span:last-child]:whitespace-normal [&>span:last-child]:break-words [&>span:last-child]:overflow-visible';

/** Level 3 records table — each row is a clickable card opening the detail pane. */
export default function Level3Table({ strategy, blocks, level2Items, onOpen, onReorder, selectedIds, onToggleSelect, moveMode }) {
  const levelName = levelLabel(strategy, LEVELS.PRIORITIES);
  const level2Enabled = levelEnabled(strategy, LEVELS.THEME);
  const pillarById = useMemo(() => Object.fromEntries(level2Items.map((p) => [p.id, p])), [level2Items]);
  // Objectives has no Priority field — only custom columns extend the grid.
  const customCols = useMemo(() => getTableCustomColumns(strategy, 3), [strategy?.level_field_config]);
  const fields = useMemo(() => [...LEVEL3_FIELDS, ...customFieldEntries(customCols)], [customCols]);
  const gridStyle = { gridTemplateColumns: `auto 52fr 14fr 14fr 14fr${customCols.map(() => ' 14fr').join('')}` };

  const view = useBlockTableView(blocks, 3, levelName, fields, customCols);
  const { rows, canReorder, groupBy, sectionsFor, toolbarProps, healthFilter, setHealthFilter, healthCounts } = view;
  const { order, onDragEnd } = useRowReorder(rows, canReorder, onReorder);
  const sections = sectionsFor(order);
  const grouped = !!groupBy;

  const headerRow = (
    <div style={gridStyle} className={cn(GRID, 'py-3 bg-secondary/40 border-b border-border text-xs font-semibold text-foreground/80 uppercase tracking-wide items-center')}>
      <span className="w-4" />
      <span>{levelName}</span>
      <span>Health</span>
      <span>Executive Sponsor</span>
      <span>Owner</span>
      {customCols.map((c) => <span key={c.id} className="truncate">{c.title}</span>)}
    </div>
  );

  const renderRows = (list) => list.map((b) => {
    const index = order.indexOf(b);
    const hs = healthStyle(b.health);
    const pillar = level2Enabled ? pillarById[b.level2_id] : null;
    const dragEnabled = canReorder && moveMode && selectedIds.size === 1 && selectedIds.has(b.id);
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
              className={cn(GRID, 'py-3 items-center cursor-pointer hover:bg-sidebar-accent/70 transition-colors', selectedIds.has(b.id) && 'bg-primary/10 hover:bg-primary/10')}>

              <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                <RowSelectCircle checked={selectedIds.has(b.id)} onChange={() => onToggleSelect(b.id)} />
                <span
                  {...dragProvided.dragHandleProps}
                  className={cn('text-muted-foreground/50 hover:text-muted-foreground', dragEnabled ? 'cursor-grab active:cursor-grabbing' : 'hidden')}
                  title="Drag to reorder">
                  <GripVertical className="w-4 h-4" />
                </span>
              </span>

              <div className="flex items-start gap-2.5 min-w-0">
                <span className="shrink-0 mt-0.5"><LevelIcon level={LEVELS.PRIORITIES} size="reg" /></span>
                <div className="min-w-0">
                  <p className="text-sm text-foreground break-words [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-medium">{b.title}</p>
                  {(b.custom_id || pillar) &&
                    <div className="flex items-center gap-1.5 flex-wrap mt-1">
                      {b.custom_id &&
                        <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-semibold">
                          ID: {b.custom_id}
                        </span>
                      }
                      {pillar && <Level2Badge pillar={pillar} />}
                    </div>
                  }
                </div>
              </div>

              {b.health ?
                <span className={`text-sm font-semibold ${hs.text}`}>{b.health}</span> :
                <span className="text-sm text-muted-foreground">—</span>}

              <div className="min-w-0 flex items-center gap-1.5">
                <InitialsAvatar name={b.executive_sponsor} className={WRAP_NAME} />
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <OwnerAvatarList owners={parseOwners(b)} />
              </div>
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
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          <StrategyTableToolbar {...toolbarProps} />
        </div>
      </div>

      <LevelExportDialogHost view={view} order={order} selectedIds={selectedIds} level={LEVELS.PRIORITIES} />

      {rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl overflow-hidden dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5">
          {headerRow}
          <div className="py-14 text-center text-sm text-muted-foreground">
            No {levelName.toLowerCase()} records yet. Click "Add {levelName}" to create one.
          </div>
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="level3-rows">
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