import React from 'react';
import { Plus, Columns3, ChevronDown } from 'lucide-react';
import { AddTaskIcon, AddMilestoneIcon, AddSectionIcon } from './AddItemIcons';

const ITEM = 'gap-2.5 h-9 px-[9px] text-[13px] font-medium transition-colors duration-150';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const BTN = 'flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground shadow hover:bg-primary/90 text-sm transition-colors disabled:opacity-50';

/** Add Task dropdown + Manage Columns buttons for the Tasks & Milestones view. */
export default function TaskHeaderActions({ onAdd, onManageColumns, disabled = false }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button disabled={disabled} className={BTN}>
            <Plus className="w-3.5 h-3.5" /> Add Milestone <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => onAdd('milestone')} className={ITEM}>
            <AddMilestoneIcon /> Add Milestone
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAdd('task')} className={ITEM}>
            <AddTaskIcon /> Add Task
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAdd('section')} className={ITEM}>
            <AddSectionIcon /> Add Section
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <button onClick={onManageColumns} className={BTN}>
        <Columns3 className="w-3.5 h-3.5" /> Manage Columns
      </button>
    </div>
  );
}