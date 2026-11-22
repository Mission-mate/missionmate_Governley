import React from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AddTaskIcon, AddColumnIcon, AddSectionIcon } from '@/components/strategy/level5/tasks/AddItemIcons';

/** Primary "Add Task" menu for the Planner: task, column and section creation. */
export default function PlannerAddMenu({ canAddTask, onAddTask, onAddColumn, onAddSection }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="gap-1.5"><Plus className="w-4 h-4" /> Add Task <ChevronDown className="w-4 h-4" /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem disabled={!canAddTask} onSelect={onAddTask} className="gap-2.5"><AddTaskIcon /> Add New Task</DropdownMenuItem>
        <DropdownMenuItem onSelect={onAddColumn} className="gap-2.5"><AddColumnIcon /> Add New Column</DropdownMenuItem>
        <DropdownMenuItem onSelect={onAddSection} className="gap-2.5"><AddSectionIcon /> Add New Section</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}