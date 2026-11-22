import React from 'react';
import { Eye, Pencil, Trash2, Archive, X, CircleCheck, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FloatingBarMotion from '@/components/shared/FloatingBarMotion';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active', dot: 'bg-green-500' },
  { value: 'pending', label: 'Pending', dot: 'bg-amber-500' },
  { value: 'expired', label: 'Expired', dot: 'bg-red-500' },
];

/** Floating bar for the one selected member: View · Edit · Change Status · Archive · Delete. */
export default function MemberActionBar({ open, onView, onEdit, onDelete, onArchive, onChangeStatus, onClear, showArchive = true }) {
  return (
    <FloatingBarMotion show={open}>
      <div className="flex items-center gap-1 rounded-full border border-border bg-card shadow-lg px-3 py-2">
        <div className="flex items-center gap-2 pl-2 pr-3 border-r border-border">
          <span className="flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">1</span>
          <span className="text-sm font-medium text-foreground">selected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onView} className="h-8 gap-2 text-sm">
          <Eye className="w-4 h-4" /> View
        </Button>
        <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 gap-2 text-sm">
          <Pencil className="w-4 h-4" /> Edit
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 gap-2 text-sm">
              <CircleCheck className="w-4 h-4" /> Change Status <ChevronDown className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="w-40">
            {STATUS_OPTIONS.map((s) => (
              <DropdownMenuItem key={s.value} onClick={() => onChangeStatus(s.value)} className="gap-2">
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                {s.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        {showArchive && (
          <Button variant="ghost" size="sm" onClick={onArchive} className="h-8 gap-2 text-sm">
            <Archive className="w-4 h-4" /> Archive
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onDelete} className="h-8 gap-2 text-sm text-destructive hover:text-destructive">
          <Trash2 className="w-4 h-4" /> Delete
        </Button>
        <Button variant="ghost" size="icon" onClick={onClear} className="h-8 w-8 text-muted-foreground">
          <X className="w-4 h-4" />
        </Button>
      </div>
    </FloatingBarMotion>
  );
}