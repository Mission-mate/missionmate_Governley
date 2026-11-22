import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddSectionIcon } from './AddItemIcons';

const label = (n, word) => `${word}${n === 1 ? '' : 's'}`;
const BADGE = 'w-[26px] h-[26px] rounded-full grid place-items-center text-[11px] leading-none font-bold tracking-[.01em] animate-[badgeArrive_.42s_cubic-bezier(.2,.75,.25,1)_both]';

/** Divider-line header row for a task section: leading control, collapse chevron, uppercase title and item counts. */
export default function SectionRow({ section, onOpen, control, collapsed = false, onToggleCollapse, readOnly = false, milestoneCount = 0, taskCount = 0 }) {
  return (
    <div
      onClick={readOnly ? undefined : () => onOpen(section)}
      className={cn(
        'relative flex items-center gap-2 px-4 py-2.5 -mt-px border-y border-border bg-muted/60 transition-colors',
        readOnly ? 'cursor-default' : 'cursor-pointer hover:bg-muted'
      )}
    >
      <div className="flex items-center justify-center w-6 shrink-0" onClick={(e) => e.stopPropagation()}>
        {control}
      </div>
      {onToggleCollapse && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onToggleCollapse(); }}
          className="p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        >
          <ChevronRight className={cn('w-4 h-4 transition-transform duration-200', !collapsed && 'rotate-90')} />
        </button>
      )}
      <AddSectionIcon />
      <span className="text-[13px] font-extrabold uppercase tracking-wider text-foreground truncate max-w-[60%]">
        {section.title || 'Untitled section'}
      </span>
      <span className="flex-1 h-px bg-border mx-2 min-w-[24px]" />
      <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground whitespace-nowrap shrink-0">
        <span className={cn(BADGE, '[animation-delay:.04s] bg-[#E8F5EF] text-[#4B9274] dark:bg-emerald-500/15 dark:text-emerald-300')}>{milestoneCount}</span>
        {label(milestoneCount, 'milestone')} ·
        <span className={cn(BADGE, '[animation-delay:.12s] bg-[#EAF0FC] text-[#5479C5] dark:bg-blue-500/15 dark:text-blue-300')}>{taskCount}</span>
        {label(taskCount, 'task')}
      </span>
    </div>
  );
}