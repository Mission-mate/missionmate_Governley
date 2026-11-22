import React from 'react';

import { cn } from '@/lib/utils';
import TaskCellDisplay from './TaskCellDisplay';
import { AddTaskIcon, AddMilestoneIcon } from './AddItemIcons';
import InitialsAvatar from '../../InitialsAvatar';

/** One top-level task or milestone row — click opens the detail pane; the leading slot holds the select ring or drag grip. */
export default function TaskRow({ task, grid, columns, onOpen, dragHandle, readOnly = false, selected = false }) {
  const isMilestone = task.type === 'milestone';
  const canOpen = !readOnly && !!onOpen;
  return (
    <div
      style={grid}
      onClick={canOpen ? () => onOpen(task) : undefined}
      className={cn(
        'grid gap-2 px-4 py-2.5 border-b border-border items-center transition-colors duration-150 ease-out group hover:bg-sidebar-accent/70',
        canOpen ? 'cursor-pointer' : 'cursor-default',
        selected && 'bg-primary/10 hover:bg-primary/10'
      )}>
      
      {/* Drag handle column (parents only) */}
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {dragHandle || <span className="w-4" />}
      </div>

      <div className="flex items-center gap-2 min-w-0">
        {isMilestone
          ? <AddMilestoneIcon className="!w-[18px] !h-[18px]" />
          : <AddTaskIcon className="!w-[16px] !h-[16px]" />}
        <div className="flex-1 min-w-0">
          <span title={task.title} className={cn(
            'block truncate font-body text-[13px] leading-[1.3] font-normal',
            task.completed ? 'text-muted-foreground' : 'text-foreground'
          )}>
            {task.title}
          </span>
          {(task.custom_id || task.owner) && (
            <span className="flex items-center gap-4 text-[11px] text-muted-foreground mt-0.5">
              {task.custom_id && (
                <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-semibold">
                  {isMilestone ? 'Milestone' : 'Task'} ID: {task.custom_id}
                </span>
              )}
              {task.owner && (
                <span className="inline-flex items-center gap-1.5 min-w-0">
                  Owner: <InitialsAvatar name={task.owner} className="[&>span:last-child]:text-[11px]" />
                </span>
              )}
            </span>
          )}
        </div>
      </div>
      {columns.map((col) =>
      <div key={col.kind === 'custom' ? col.id : col.key} className="min-w-0 truncate self-stretch -my-2.5 py-2.5 pl-3 flex items-center">
          <TaskCellDisplay column={col} task={task} />
        </div>
      )}
    </div>);

}