import React, { useState, useCallback } from 'react';
import { HelpCircle, GripVertical } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import ReportRow from './ReportRow';
import Collapse from '@/components/shared/Collapse';
import ParentReportRow from './ParentReportRow';

function HeaderCell({ label, tooltip }) {
  return (
    <th className="px-4 py-2.5 text-left text-xs font-semibold text-foreground/80 uppercase tracking-wide whitespace-nowrap align-middle">
      <span className="inline-flex items-center gap-1">
        {label}
        {tooltip && (
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-3 h-3 text-muted-foreground/70 cursor-help" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[240px] text-xs">{tooltip}</TooltipContent>
          </Tooltip>
        )}
      </span>
    </th>
  );
}

const Grip = () => (
  <span className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0">
    <GripVertical className="w-4 h-4" />
  </span>
);

/**
 * The reporting data table for one Level 6 record. Renders a tree of nodes:
 * parent summary rows (grey, read-only, collapsible) with editable child rows,
 * plus flat standalone rows. Top-level rows can be reordered by drag and drop
 * when `reorderable` is set — each top-level node is its own row group so its
 * children travel with it.
 */
export default function ReportTable({ nodes, columns, firstColLabel = 'Reporting Period', unit = '#', direction, readOnly = false, reorderable = false, onReorder, onEditRow, onViewRow, onDeleteRow, onDeleteParent, onOpenNotes, notesRowIds }) {
  const hasNotes = (id) => !!id && !!notesRowIds?.has(id);
  const [collapsed, setCollapsed] = useState(() => new Set());
  const [dragKey, setDragKey] = useState(null);
  const [overKey, setOverKey] = useState(null);

  const toggle = useCallback((key) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }, []);

  const canDrag = reorderable && !readOnly && nodes.length > 1;

  const drop = (key) => {
    setOverKey(null);
    const from = nodes.findIndex((n) => n.key === dragKey);
    const to = nodes.findIndex((n) => n.key === key);
    setDragKey(null);
    if (from < 0 || to < 0 || from === to) return;
    const keys = nodes.map((n) => n.key);
    const [moved] = keys.splice(from, 1);
    keys.splice(to, 0, moved);
    onReorder?.(keys);
  };

  const groupProps = (key) => canDrag ? {
    draggable: true,
    onDragStart: () => setDragKey(key),
    onDragEnd: () => { setDragKey(null); setOverKey(null); },
    onDragOver: (e) => { e.preventDefault(); if (overKey !== key) setOverKey(key); },
    onDrop: (e) => { e.preventDefault(); drop(key); },
  } : {};

  return (
    <TooltipProvider delayDuration={200}>
      <div className="border border-border rounded-lg overflow-x-auto bg-card">
        <table className="w-full">
          <thead>
            <tr className="bg-secondary/40 border-b border-border">
              <HeaderCell label={firstColLabel} />
              {columns.map((col) => (
                <HeaderCell
                  key={col.kind === 'custom' ? col.id : col.key}
                  label={col.kind === 'custom' ? col.title : col.label}
                  tooltip={col.tooltip}
                />
              ))}
              {!readOnly && <th className="px-4 py-2.5 w-20" />}
            </tr>
          </thead>
          {nodes.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={columns.length + (readOnly ? 1 : 2)} className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {readOnly ? 'No reporting data yet.' : 'No reporting data yet. Click "Add Data" to create a row.'}
                </td>
              </tr>
            </tbody>
          ) : (
            nodes.map((node) => {
              const dimmed = dragKey === node.key;
              const marked = overKey === node.key && dragKey && dragKey !== node.key;
              const cls = cn(dimmed && 'opacity-40', marked && 'outline outline-2 -outline-offset-2 outline-primary/60');
              if (node.type === 'row') {
                return (
                  <tbody key={node.key} className={cls} {...groupProps(node.key)}>
                    <ReportRow
                      row={node.display}
                      columns={columns}
                      label={node.label}
                      unit={unit}
                      direction={direction}
                      grip={canDrag ? <Grip /> : null}
                      readOnly={readOnly}
                      hasNotes={hasNotes(node.row?.id)}
                      onOpenNotes={onOpenNotes}
                      onEdit={() => onEditRow(node.row)}
                      onView={() => onViewRow(node.row)}
                      onDelete={() => onDeleteRow(node.row)}
                    />
                  </tbody>
                );
              }
              const expanded = !collapsed.has(node.key);
              return (
                <tbody key={node.key} className={cls} {...groupProps(node.key)}>
                  <ParentReportRow
                    node={node}
                    columns={columns}
                    expanded={expanded}
                    unit={unit}
                    direction={direction}
                    grip={canDrag ? <Grip /> : null}
                    readOnly={readOnly}
                    hasNotes={hasNotes(node.row?.id)}
                    onOpenNotes={onOpenNotes}
                    onToggle={() => toggle(node.key)}
                    onDelete={() => onDeleteParent(node)}
                  />
                  <Collapse open={expanded}>{(cls) => node.children.map((c) => (
                    <ReportRow
                      key={c.key}
                      row={c.display}
                      columns={columns}
                      label={c.label}
                      unit={unit}
                      direction={direction}
                      indent
                      className={cls}
                      showDelete={false}
                      readOnly={readOnly}
                      hasNotes={hasNotes(c.row?.id)}
                      onOpenNotes={onOpenNotes}
                      onEdit={() => onEditRow(c.row)}
                      onView={() => onViewRow(c.row)}
                    />
                  ))}</Collapse>
                </tbody>
              );
            })
          )}
        </table>
      </div>
    </TooltipProvider>
  );
}