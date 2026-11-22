import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TASK_STATUSES } from '@/lib/obligationTasks';
import TaskStatusPill from './TaskStatusPill';
import { META_EDITABLE } from '@/components/shared/metaStyles';

/** Click the pill to open an overlay listing all task statuses. */
export default function TaskStatusPicker({ value, onChange, readOnly = false }) {
  const [open, setOpen] = useState(false);
  if (readOnly) return <TaskStatusPill status={value} />;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" title="Set task status" className={`px-1.5 py-1 -ml-1.5 ${META_EDITABLE}`}>
          <TaskStatusPill status={value} />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-52 p-1 z-[200]">
        {TASK_STATUSES.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => { if (s.value !== value) onChange(s.value); setOpen(false); }}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-muted transition-colors"
          >
            <TaskStatusPill status={s.value} />
            {s.value === value && <Check className="w-4 h-4 text-primary" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}