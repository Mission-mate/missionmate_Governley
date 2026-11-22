import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Lock } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import ModuleToggleDialog from './ModuleToggleDialog';
import { cn } from '@/lib/utils';
import { orderModules, PINNED_MODULE_IDS } from '@/lib/modules';
import { useModules } from '@/hooks/useModules';
import ModuleLoader from '@/components/shared/states/ModuleLoader';

function Toggle({ active, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      disabled={disabled}
      title={disabled ? 'Only admins can change modules' : undefined}
      onClick={(e) => {e.stopPropagation();onChange(e);}}
      className={cn(
        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 disabled:cursor-not-allowed disabled:opacity-50',
        active ? 'bg-green-500' : 'bg-red-400'
      )}>
      
      <span
        className={cn(
          'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
          active ? 'translate-x-6' : 'translate-x-1'
        )} />
      
    </button>);

}

function ModuleRow({ obj, active, onToggle, dragHandleProps, isDragging, locked, canEdit }) {
  const Icon = obj.icon;
  return (
    <div
      className={cn(
        'flex items-center px-4 py-3.5 gap-3 bg-card transition-colors',
        isDragging && 'shadow-lg rounded-lg border border-border'
      )}>
      
      {/* Drag handle (hidden/disabled for pinned modules) */}
      <div
        {...locked ? {} : dragHandleProps}
        className={cn(
          'shrink-0 w-5 flex items-center justify-center',
          locked ? 'text-transparent' : 'text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing'
        )}>
        
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Icon */}
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', obj.iconBg)}>
        <Icon className={cn('w-4.5 h-4.5', obj.iconColor)} size={18} />
      </div>

      {/* Label + description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{obj.label}</p>
        <p className="text-xs text-muted-foreground">{obj.description}</p>
      </div>

      {/* Toggle + status */}
      <div className="w-40 flex items-center gap-2.5">
        <Toggle active={active} disabled={!canEdit} onChange={() => onToggle(obj, !active)} />
        <span className={cn('text-sm font-medium', active ? 'text-green-600' : 'text-red-500')}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>);

}

export default function ObjectsTab() {
  const { isModuleActive, toggleModule, moduleOrder, reorderModules, isLoading } = useModules();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [pending, setPending] = useState(null);

  const requestToggle = (module, enable) => {
    if (isAdmin) setPending({ module, enable });
  };

  const confirmToggle = async () => {
    try {
      await toggleModule(pending.module.id);
      setPending(null);
    } catch {
      // The hook already reverted the change and showed an error; keep the dialog open to retry.
    }
  };

  const modules = orderModules(moduleOrder);
  const pinnedModules = modules.filter((m) => PINNED_MODULE_IDS.includes(m.id));
  const draggableModules = modules.filter((m) => !PINNED_MODULE_IDS.includes(m.id));

  const handleDragEnd = (result) => {
    if (!isAdmin || !result.destination) return;
    const from = result.source.index;
    const to = result.destination.index;
    if (from === to) return;

    // Reorder within the draggable list; pinned modules keep their place at the top.
    const draggable = [...draggableModules];
    const [moved] = draggable.splice(from, 1);
    draggable.splice(to, 0, moved);
    reorderModules(draggable.map((m) => m.id));
  };

  return (
    <div className="border border-border rounded-xl bg-card p-6">
      <h2 className="text-xl font-bold text-foreground mb-1">Modules</h2>
      <p className="text-sm text-muted-foreground mb-5">Enable or disable modules across your workspace. Enabled modules appear in the left navigation panel. Drag to reorder how they appear in the navigation.

      </p>

      {!isLoading && !isAdmin &&
      <div className="mb-4 flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          <Lock className="w-4 h-4 shrink-0" />
          Only admins can enable, disable or reorder modules.
        </div>
      }

      {isLoading ? <ModuleLoader /> :
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="flex items-center px-4 py-2.5 bg-secondary/40 border-b border-border">
          <span className="w-5 shrink-0" />
          <span className="flex-1 text-xs font-semibold text-foreground/80 uppercase tracking-wide pl-3">Module</span>
          <span className="w-40 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Status</span>
        </div>

        {/* Pinned modules — not draggable */}
        {pinnedModules.map((obj) =>
        <div key={obj.id} className="border-b border-border">
            <ModuleRow
            obj={obj}
            active={isModuleActive(obj.id)}
            onToggle={requestToggle}
            canEdit={isAdmin}
            locked />
          
          </div>
        )}

        {/* Draggable modules */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="modules">
            {(provided) =>
            <div ref={provided.innerRef} {...provided.droppableProps}>
                {draggableModules.map((obj, idx) =>
              <Draggable key={obj.id} draggableId={obj.id} index={idx} isDragDisabled={!isAdmin}>
                    {(dragProvided, snapshot) =>
                <div
                  ref={dragProvided.innerRef}
                  {...dragProvided.draggableProps}
                  className={cn(idx < draggableModules.length - 1 && 'border-b border-border')}>
                  
                        <ModuleRow
                    obj={obj}
                    active={isModuleActive(obj.id)}
                    onToggle={requestToggle}
                    canEdit={isAdmin}
                    locked={!isAdmin}
                    dragHandleProps={dragProvided.dragHandleProps}
                    isDragging={snapshot.isDragging} />
                  
                      </div>
                }
                  </Draggable>
              )}
                {provided.placeholder}
              </div>
            }
          </Droppable>
        </DragDropContext>
      </div>
      }

      <ModuleToggleDialog target={pending} onConfirm={confirmToggle} onClose={() => setPending(null)} />
    </div>);

}