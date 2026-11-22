import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { levelLabel } from '@/lib/strategy';
import { LEVELS } from '@/lib/strategyLayers';
import LevelIcon from '@/components/strategy/connections/LevelIcon';
import InitialsAvatar from '@/components/strategy/InitialsAvatar';
import { healthStyle } from '@/components/strategy/level3/health';
import { priorityStyle, statusStyle } from '@/components/strategy/priority';

export const TREE_GRID = 'grid grid-cols-[minmax(0,1fr)_130px_140px_110px] gap-3 px-4';
export const TREE_GRID_NO_PRIORITY = 'grid grid-cols-[minmax(0,1fr)_130px_140px] gap-3 px-4';

/** Recursive row in the Overview strategy tree — built from Contributes To links. */
export default function StrategyTreeRow({ node, depth, index, strategy, childrenMap, matchedIds, onSelect, showPriority = true }) {
  const grid = showPriority ? TREE_GRID : TREE_GRID_NO_PRIORITY;
  const kids = childrenMap[node.id] || [];
  const [expanded, setExpanded] = useState(true);
  const hs = healthStyle(node.health || '');
  // In search mode, ancestor-only rows are dimmed context; matched rows stay at full opacity.
  const dimmed = matchedIds ? !matchedIds.has(node.id) : false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.22, delay: Math.min(index * 0.04, 0.4), ease: 'easeOut' }}
    >
      <div
        onClick={() => onSelect?.(node)}
        className={cn(grid, 'relative py-3 border-b border-border items-center hover:bg-sidebar-accent/70 transition-colors cursor-pointer', dimmed && 'opacity-50')}
      >
        {/* Branch connector — same treatment as the Policy table's linked-document line. */}
        {depth > 0 && (
          <span
            aria-hidden="true"
            className="absolute top-0 h-1/2 w-[18px] border-l border-b border-muted-foreground/40 rounded-bl-lg"
            style={{ left: 16 + (depth - 1) * 28 + 10 }}
          />
        )}
        <div className="flex items-center gap-2 min-w-0" style={{ paddingLeft: depth * 28 }}>

          {kids.length > 0 ? (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground shrink-0"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <ChevronDown className={cn('w-4 h-4 transition-transform duration-200', !expanded && '-rotate-90')} />
            </button>
          ) : (
            <span className="w-5 shrink-0" />
          )}
          <LevelIcon level={node.level} size="sm" />
          <div className="min-w-0">
            <p className={cn("text-sm text-foreground truncate [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif]", node.level === LEVELS.PRIORITIES ? 'font-medium' : 'font-normal')}>{node.title}</p>
            <div className="flex items-center gap-1.5 flex-wrap mt-1 text-[11px] text-muted-foreground">
              {node.custom_id && (
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-semibold">
                  ID: {node.custom_id}
                </span>
              )}
              <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground font-semibold">
                {levelLabel(strategy, node.level)}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <span className="font-semibold">Owner:</span>{' '}
                {node.owner ? <InitialsAvatar name={node.owner} /> : <span className="italic">Unassigned</span>}
              </span>
            </div>
          </div>
        </div>

        <span className={cn('text-sm font-semibold', node.health ? hs.text : 'text-muted-foreground')}>
          {node.health || '—'}
        </span>

        <div>
          {node.status ? (
            <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', statusStyle(node.status))}>
              {node.status}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">—</span>
          )}
        </div>

        {showPriority && (
          <div>
            {node.priority ? (
              <span className={cn('inline-flex items-center text-xs font-medium rounded-full px-2.5 py-0.5', priorityStyle(node.priority))}>
                {node.priority}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </div>
        )}
      </div>

      <AnimatePresence initial={false}>
        {expanded &&
          kids.map((k, i) => (
            <StrategyTreeRow key={k.id} node={k} depth={depth + 1} index={i} strategy={strategy} childrenMap={childrenMap} matchedIds={matchedIds} onSelect={onSelect} showPriority={showPriority} />
          ))}
      </AnimatePresence>
    </motion.div>
  );
}