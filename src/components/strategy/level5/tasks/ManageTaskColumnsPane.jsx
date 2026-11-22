import React from 'react';
import { Pencil, Trash2, Lock, GripVertical, Plus } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Checkbox } from '@/components/ui/checkbox';
import SlidePane from '@/components/ui/SlidePane';
import { builtinColumn, SYSTEM_TASK_KEYS, PINNED_LAST_TASK_KEY, HIDEABLE_TASK_KEYS, isSystemVisible } from './taskColumns';
import { cn } from '@/lib/utils';
import CloseButton from '@/components/shared/CloseButton';
import useRemovalConfirm from '@/components/shared/customizer/useRemovalConfirm';
const MUTED_BAND = 'bg-[oklch(0.965_0.006_260)]';

/** Right pane for managing the Level 5 task table columns. System fields are locked; optional fields toggle; custom fields fully editable. */
export default function ManageTaskColumnsPane({ isOpen, onClose, config, onChange, onEdit, onAddColumn }) {
  // System columns always render in their fixed, locked order.
  const systemKeys = SYSTEM_TASK_KEYS.filter((k) => config.optional_order.includes(k));
  // Progress % is pinned to the end of the optional list and cannot be reordered.
  const optionalKeys = config.optional_order.filter((k) => !SYSTEM_TASK_KEYS.includes(k) && k !== PINNED_LAST_TASK_KEY);

  const toggleOptional = (key) => {
    const visible = config.optional_visible.includes(key) ?
    config.optional_visible.filter((k) => k !== key) :
    [...config.optional_visible, key];
    onChange({ ...config, optional_visible: visible });
  };

  const toggleSystem = (key) => {
    const hidden = config.system_hidden.includes(key) ?
    config.system_hidden.filter((k) => k !== key) :
    [...config.system_hidden, key];
    onChange({ ...config, system_hidden: hidden });
  };

  const toggleCustom = (id) => {
    onChange({ ...config, custom: config.custom.map((c) => c.id === id ? { ...c, visible: c.visible === false } : c) });
  };

  const { confirm, dialog } = useRemovalConfirm();
  const deleteCustom = (c) => confirm('column', c.title, () => onChange({ ...config, custom: config.custom.filter((x) => x.id !== c.id) }));

  // Reorder within a subset of optional_order while preserving the other group's positions.
  const reorderGroup = (groupKeys, from, to) => {
    const next = [...groupKeys];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    // Rebuild optional_order: system group first, then optional group.
    const otherFirst = SYSTEM_TASK_KEYS.includes(groupKeys[0]);
    const other = config.optional_order.filter((k) =>
    otherFirst ? !SYSTEM_TASK_KEYS.includes(k) && k !== PINNED_LAST_TASK_KEY : SYSTEM_TASK_KEYS.includes(k)
    );
    const order = otherFirst ? [...next, ...other] : [...other, ...next];
    onChange({ ...config, optional_order: [...order.filter((k) => k !== PINNED_LAST_TASK_KEY), PINNED_LAST_TASK_KEY] });
  };

  const onDragOptional = (r) => {if (r.destination) reorderGroup(optionalKeys, r.source.index, r.destination.index);};

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


  return (
    <SlidePane isOpen={isOpen} onClose={onClose} className="bg-card shadow-2xl flex flex-col font-body">
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <div>
          <h2 className="text-lg font-bold text-foreground">Manage Columns</h2>
        </div>
        <CloseButton onClick={onClose} className="shrink-0" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        {/* System columns */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">System Columns</p>
          <p className="text-xs text-muted-foreground mt-1 mb-2">System fields are locked. Priority can be hidden.</p>
          <div className="border border-border rounded-lg divide-y divide-border">
            {systemKeys.map((key) => {
              const col = builtinColumn(config, key);
              if (!col) return null;
              return (
                <div key={key} className="flex items-center gap-2 px-3 py-2.5 bg-card">
                  {HIDEABLE_TASK_KEYS.includes(key) && (
                    <Checkbox className="rounded-full" checked={isSystemVisible(config, key)} onCheckedChange={() => toggleSystem(key)} />
                  )}
                  <span className="text-sm text-foreground flex-1 truncate">{col.label}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{col.type}</span>
                  <span className="p-0.5 text-muted-foreground/40" title="Locked — always shown and cannot be edited"><Lock className="w-3.5 h-3.5" /></span>
                </div>);

            })}
          </div>
        </div>

        {/* Optional columns */}
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">Optional Columns</p>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Selected columns will be displayed in the table.</p>
          <DragDropContext onDragEnd={onDragOptional}>
            <Droppable droppableId="optional-cols">
              {(dp) =>
              <div ref={dp.innerRef} {...dp.droppableProps} className="border border-border rounded-lg divide-y divide-border">
                  {optionalKeys.map((key, idx) => {
                  const col = builtinColumn(config, key);
                  if (!col) return null;
                  return (
                    <Draggable key={key} draggableId={key} index={idx}>
                        {(dr, snap) =>
                      <div ref={dr.innerRef} {...dr.draggableProps} className={cn('flex items-center gap-2 px-3 py-2.5 bg-card', snap.isDragging && 'shadow-lg rounded-md')}>
                            <DragHandle {...dr.dragHandleProps} />
                            <Checkbox className="rounded-full" checked={config.optional_visible.includes(key)} onCheckedChange={() => toggleOptional(key)} />
                            <span className="text-sm text-foreground flex-1 truncate">{col.label}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{col.type}</span>
                            <button onClick={() => onEdit(col)} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                            <span className="p-0.5 text-muted-foreground/40" title="Optional field — cannot be deleted"><Lock className="w-3.5 h-3.5" /></span>
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
          <p className={cn("text-muted-foreground rounded-lg px-3 py-4 text-center text-xs", MUTED_BAND)}>
              No custom columns yet. Use "+ Add Column" to create one.
            </p> :

          <DragDropContext onDragEnd={onDragCustom}>
              <Droppable droppableId="custom-cols">
                {(dp) =>
              <div ref={dp.innerRef} {...dp.droppableProps} className="border border-border rounded-lg divide-y divide-border">
                    {config.custom.map((c, idx) =>
                <Draggable key={c.id} draggableId={c.id} index={idx}>
                        {(dr, snap) =>
                  <div ref={dr.innerRef} {...dr.draggableProps} className={cn('flex items-center gap-2 px-3 py-2.5 bg-card', snap.isDragging && 'shadow-lg rounded-md')}>
                            <DragHandle {...dr.dragHandleProps} />
                            <Checkbox className="rounded-full" checked={c.visible !== false} onCheckedChange={() => toggleCustom(c.id)} />
                            <span className="text-sm text-foreground flex-1 truncate">{c.title}</span>
                            <span className="text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide">{c.type}</span>
                            <button onClick={() => onEdit({ kind: 'custom', ...c })} className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => deleteCustom(c)} className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                  }
                      </Draggable>
                )}
                    {dp.placeholder}
                  </div>
              }
              </Droppable>
            </DragDropContext>
          }
        </div>
      </div>
      {dialog}
    </SlidePane>);

}