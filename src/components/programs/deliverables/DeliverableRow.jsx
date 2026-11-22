import React from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import ProgramIcon from '@/components/programs/ProgramIcon';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import SelectCircle from './SelectCircle';
import { customFieldText } from './CustomFieldInput';
import { healthClass, statusClass, priorityClass } from '@/lib/programs/deliverableOptions';

export const ROW_GRID = 'grid gap-3 px-5';
const PILL = 'inline-flex w-fit items-center text-xs font-medium rounded-full px-2.5 py-0.5';
const Dash = () => <span className="text-sm text-muted-foreground">—</span>;

/** One deliverable row — same layout and type as the Strategy register rows. */
export default function DeliverableRow({ d, config, gridStyle, color, selected, onSelect, onOpen, drag }) {
  return (
    <div ref={drag?.innerRef} {...drag?.draggableProps} onClick={() => onOpen(d)} style={{ ...drag?.draggableProps.style, ...gridStyle }}
      className={cn(ROW_GRID, 'py-3 items-center cursor-pointer border-b border-border last:border-b-0 bg-card hover:bg-sidebar-accent/70 transition-colors', selected && 'bg-primary/10 hover:bg-primary/10', drag?.isDragging && 'shadow-lg rounded-lg border')}>
      <span className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <SelectCircle checked={selected} onChange={() => onSelect(d.id)} />
        <span {...drag?.dragHandleProps} title="Drag to reorder"
          className={cn('text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing', !drag?.enabled && 'hidden')}>
          <GripVertical className="w-4 h-4" />
        </span>
      </span>
      <div className="flex items-center gap-2.5 min-w-0">
        <ProgramIcon color={color} size="sm" />
        <p className="min-w-0 text-sm text-foreground truncate font-medium">{d.title}</p>
      </div>
      {d.health ? <span className={cn('text-sm font-semibold', healthClass(d.health))}>{d.health}</span> : <Dash />}
      <span className="flex items-center gap-1.5 min-w-0 text-sm text-foreground">
        {d.owner && <><PersonInitialsAvatar name={d.owner} className="h-6 w-6 text-[10px] shrink-0" /><span className="truncate">{d.owner}</span></>}
      </span>
      <span>{d.status ? <span className={cn(PILL, statusClass(d.status))}>{d.status}</span> : <Dash />}</span>
      {config.show_priority && <span>{d.priority ? <span className={cn(PILL, priorityClass(d.priority))}>{d.priority}</span> : <Dash />}</span>}
      {config.custom_columns.map((c) => (
        <span key={c.id} className="min-w-0 truncate text-sm text-foreground">{customFieldText(c, d.custom_fields?.[c.id])}</span>
      ))}
    </div>
  );
}