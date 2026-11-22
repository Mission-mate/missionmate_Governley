import React, { useState } from 'react';
import { Lock, Pencil, Trash2, HelpCircle, Check, GripVertical, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import SlidePane from '@/components/ui/SlidePane';
import { SYSTEM_COLUMNS, OPTIONAL_COLUMNS, optionalLabel, systemLabel, systemColumnOrder, REORDERABLE_SYSTEM_KEYS, isSystemVisible } from './reportColumns';
import { cn } from '@/lib/utils';
import CloseButton from '@/components/shared/CloseButton';
import useRemovalConfirm from '@/components/shared/customizer/useRemovalConfirm';
const MUTED_BAND = 'bg-[oklch(0.965_0.006_260)]';

function HelpTip({ text }) {
  if (!text) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground/70 cursor-help shrink-0" />
      </TooltipTrigger>
      {/* z above the SlidePane (z-[101]) so tooltips aren't clipped behind it */}
      <TooltipContent side="left" className="z-[200] max-w-[240px] text-xs">{text}</TooltipContent>
    </Tooltip>);

}

function InlineRename({ value, onSave, onCancel }) {
  const [text, setText] = useState(value);
  return (
    <div className="flex items-center gap-1 flex-1">
      <Input value={text} onChange={(e) => setText(e.target.value)} className="h-7 text-sm" autoFocus
      onKeyDown={(e) => {if (e.key === 'Enter') onSave(text);if (e.key === 'Escape') onCancel();}} />
      <button onClick={() => onSave(text)} className="p-1 text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
      <CloseButton onClick={onCancel} />
    </div>);

}

/** Right pane for managing the Level 6 reporting table columns. */
export default function ManageColumnsPane({ isOpen, onClose, config, onChange, onAddColumn }) {
  const [renaming, setRenaming] = useState(null); // { kind, key/id }

  const systemKeys = systemColumnOrder(config); // reorderable keys first, variance pinned last

  const toggleOptional = (key) => {
    const visible = config.optional_visible.includes(key) ?
    config.optional_visible.filter((k) => k !== key) :
    [...config.optional_visible, key];
    onChange({ ...config, optional_visible: visible });
  };

  const renameOptional = (key, label) => {
    onChange({ ...config, optional_labels: { ...config.optional_labels, [key]: label.trim() || undefined } });
    setRenaming(null);
  };

  const toggleSystem = (key) => {
    const hidden = config.system_hidden || [];
    onChange({ ...config, system_hidden: hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key] });
  };

  const renameSystem = (key, label) => {
    onChange({ ...config, system_labels: { ...(config.system_labels || {}), [key]: label.trim() || undefined } });
    setRenaming(null);
  };

  const toggleCustom = (id) => {
    onChange({ ...config, custom: config.custom.map((c) => c.id === id ? { ...c, visible: c.visible === false } : c) });
  };

  const renameCustom = (id, title) => {
    if (title.trim()) onChange({ ...config, custom: config.custom.map((c) => c.id === id ? { ...c, title: title.trim() } : c) });
    setRenaming(null);
  };

  const { confirm, dialog } = useRemovalConfirm();
  const deleteCustom = (c) => confirm('column', c.title, () => onChange({ ...config, custom: config.custom.filter((x) => x.id !== c.id) }));

  // Only Expected/Actual reorder; Variance is pinned last and excluded from the drag list.
  const onDragSystem = (r) => {
    if (!r.destination) return;
    const reorderable = systemKeys.filter((k) => REORDERABLE_SYSTEM_KEYS.includes(k));
    const [moved] = reorderable.splice(r.source.index, 1);
    reorderable.splice(r.destination.index, 0, moved);
    onChange({ ...config, system_order: reorderable });
  };

  const onDragOptional = (r) => {
    if (!r.destination) return;
    const order = [...config.optional_order];
    const [moved] = order.splice(r.source.index, 1);
    order.splice(r.destination.index, 0, moved);
    onChange({ ...config, optional_order: order });
  };

  const onDragCustom = (r) => {
    if (!r.destination) return;
    const custom = [...config.custom];
    const [moved] = custom.splice(r.source.index, 1);
    custom.splice(r.destination.index, 0, moved);
    onChange({ ...config, custom });
  };

  const DragHandle = (props) =>
  <span {...props} className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
      <GripVertical className="w-4 h-4" />
    </span>;


  const reorderableSystemKeys = systemKeys.filter((k) => REORDERABLE_SYSTEM_KEYS.includes(k));
  const pinnedSystemKeys = systemKeys.filter((k) => !REORDERABLE_SYSTEM_KEYS.includes(k));

  const renderSystemRow = (key, dragProps, handleProps, isDragging) => {
    const def = SYSTEM_COLUMNS.find((c) => c.key === key);
    if (!def) return null;
    const isRenaming = renaming?.kind === 'system' && renaming.key === key;
    return (
      <div {...dragProps || {}} className={cn('flex items-center gap-2 px-3 py-2.5', isDragging && 'bg-card shadow-lg rounded-md')}>
        {isRenaming ?
        <InlineRename value={systemLabel(config, key)} onSave={(v) => renameSystem(key, v)} onCancel={() => setRenaming(null)} /> :

        <>
            {handleProps ? <DragHandle {...handleProps} /> : <span className="w-4 shrink-0" />}
            {def.hideable && (
              <Checkbox className="rounded-full" checked={isSystemVisible(config, key)} onCheckedChange={() => toggleSystem(key)} />
            )}
            <span className="text-sm text-foreground flex-1 flex items-center gap-1.5 min-w-0">
              <span className="truncate">{systemLabel(config, key)}</span>
              <HelpTip text={def.tooltip} />
            </span>
            {def.renamable &&
          <button onClick={() => setRenaming({ kind: 'system', key })} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
          }
            <span className="p-0.5 text-muted-foreground/40" title="Locked — cannot be deleted"><Lock className="w-3.5 h-3.5" /></span>
          </>
        }
      </div>);

  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose} className="bg-card shadow-2xl flex flex-col font-body">
      <TooltipProvider delayDuration={200}>
        <div className="flex items-start justify-between px-5 pt-5 pb-2">
          <div>
            <h2 className="text-lg font-bold text-foreground">Manage Columns</h2>
          </div>
          <CloseButton onClick={onClose} className="shrink-0" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* System columns — Expected/Actual reorderable, Variance pinned */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">System Columns</p>
            <p className="text-xs text-muted-foreground mt-1 mb-2">System fields are locked.</p>
            <div className="border border-border rounded-lg divide-y divide-border">
              <DragDropContext onDragEnd={onDragSystem}>
                <Droppable droppableId="l6-system-cols">
                  {(dp) =>
                  <div ref={dp.innerRef} {...dp.droppableProps} className="divide-y divide-border">
                      {reorderableSystemKeys.map((key, idx) =>
                    <Draggable key={key} draggableId={`sys-${key}`} index={idx}>
                          {(dr, snap) =>
                      <div ref={dr.innerRef} {...dr.draggableProps}>
                              {renderSystemRow(key, {}, dr.dragHandleProps, snap.isDragging)}
                            </div>
                      }
                        </Draggable>
                    )}
                      {dp.placeholder}
                    </div>
                  }
                </Droppable>
              </DragDropContext>
              {pinnedSystemKeys.map((key) =>
              <div key={key}>{renderSystemRow(key, {}, null, false)}</div>
              )}
            </div>
          </div>

          {/* Optional columns */}
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Optional Columns</p>
            <p className="text-xs text-muted-foreground mt-1 mb-2">Selected columns will be displayed in the table. </p>
            <DragDropContext onDragEnd={onDragOptional}>
              <Droppable droppableId="l6-optional-cols">
                {(dp) =>
                <div ref={dp.innerRef} {...dp.droppableProps} className="border border-border rounded-lg divide-y divide-border">
                    {config.optional_order.map((key, idx) => {
                    const def = OPTIONAL_COLUMNS.find((c) => c.key === key);
                    if (!def) return null;
                    const isRenaming = renaming?.kind === 'optional' && renaming.key === key;
                    return (
                      <Draggable key={key} draggableId={key} index={idx}>
                          {(dr, snap) =>
                        <div ref={dr.innerRef} {...dr.draggableProps} className={cn('flex items-center gap-2 px-3 py-2.5', snap.isDragging && 'bg-card shadow-lg rounded-md')}>
                              {isRenaming ?
                          <InlineRename value={optionalLabel(config, key)} onSave={(v) => renameOptional(key, v)} onCancel={() => setRenaming(null)} /> :

                          <>
                                  <DragHandle {...dr.dragHandleProps} />
                                  <Checkbox className="rounded-full" checked={config.optional_visible.includes(key)} onCheckedChange={() => toggleOptional(key)} />
                                  <span className="text-sm text-foreground flex-1 flex items-center gap-1.5 min-w-0">
                                    <span className="truncate">{optionalLabel(config, key)}</span>
                                    <HelpTip text={def.tooltip} />
                                  </span>
                                  {def.computed &&
                            <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">Auto-Calculated</span>
                            }
                                  <button onClick={() => setRenaming({ kind: 'optional', key })} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                                  <span className="p-0.5 text-muted-foreground/40" title="Optional field — cannot be deleted"><Lock className="w-3.5 h-3.5" /></span>
                                </>
                          }
                            </div>
                        }
                        </Draggable>);

                  })}
                    {dp.placeholder}
                  </div>
                }
              </Droppable>
            </DragDropContext>
          </div>

          {/* Custom columns */}
          <div>
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Custom Columns</p>
              <button
                onClick={onAddColumn}
                className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md border border-input bg-white text-xs font-medium text-foreground shadow-sm hover:bg-accent transition-colors">
                <Plus className="w-3.5 h-3.5" /> Add Column
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-2">Custom fields support full editing.</p>
            {config.custom.length === 0 ?
            <p className={cn('text-xs text-muted-foreground rounded-lg px-3 py-4 text-center', MUTED_BAND)}>
                No custom columns yet. Use "+ Add Column" to create one.
              </p> :

            <DragDropContext onDragEnd={onDragCustom}>
                <Droppable droppableId="l6-custom-cols">
                  {(dp) =>
                <div ref={dp.innerRef} {...dp.droppableProps} className="border border-border rounded-lg divide-y divide-border">
                      {config.custom.map((c, idx) => {
                    const isRenaming = renaming?.kind === 'custom' && renaming.id === c.id;
                    return (
                      <Draggable key={c.id} draggableId={c.id} index={idx}>
                            {(dr, snap) =>
                        <div ref={dr.innerRef} {...dr.draggableProps} className={cn('flex items-center gap-2 px-3 py-2.5', snap.isDragging && 'bg-card shadow-lg rounded-md')}>
                                {isRenaming ?
                          <InlineRename value={c.title} onSave={(v) => renameCustom(c.id, v)} onCancel={() => setRenaming(null)} /> :

                          <>
                                    <DragHandle {...dr.dragHandleProps} />
                                    <Checkbox className="rounded-full" checked={c.visible !== false} onCheckedChange={() => toggleCustom(c.id)} />
                                    <span className="text-sm text-foreground flex-1 truncate">{c.title}</span>
                                    <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{c.type}</span>
                                    <button onClick={() => setRenaming({ kind: 'custom', id: c.id })} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => deleteCustom(c)} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                                  </>
                          }
                              </div>
                        }
                          </Draggable>);

                  })}
                      {dp.placeholder}
                    </div>
                }
                </Droppable>
              </DragDropContext>
            }
          </div>
        </div>
      </TooltipProvider>
      {dialog}
    </SlidePane>);

}