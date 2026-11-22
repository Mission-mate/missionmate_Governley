import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { findStatusColumn } from '@/lib/programs/plannerApi';
import { AddSectionIcon } from '@/components/strategy/level5/tasks/AddItemIcons';
import PlannerSectionCard, { COL, NAME } from './PlannerSectionCard';
import ColumnTypeIcon from './ColumnTypeIcon';
import PlannerDragContext from './PlannerDragContext';

/** List view: each section is a raised card; one column per configured planner column. */
export default function PlannerList({ grid, selection, onOpenTask, onAddTask, onOpenSection, onAddSection, sectionActions }) {
  const { sections, columns, cellMap, rowsBySection, grouped } = grid;
  const [collapsed, setCollapsed] = useState({});
  const statusColumn = findStatusColumn(columns);

  return (
    <div className="content-enter min-w-0">
      <div className="w-full space-y-3">
        <div className="flex items-center h-10 border-x border-transparent text-xs font-semibold uppercase tracking-wide text-foreground/80">
          <div className={cn(NAME, 'px-4 pl-11')}>Name</div>
          {columns.map((c, i) => (
            <div key={c.id} className={cn(COL, 'group gap-2 border-l-transparent')}><ColumnTypeIcon type={c.type} systemKey={c.system_key} index={i} /><span className="truncate">{c.title}</span></div>
          ))}
        </div>

        <PlannerDragContext rowsFor={(id) => rowsBySection[id] || []} onReorder={selection.onReorder}>
        {sections.map((s, i) => (
          <PlannerSectionCard key={s.id} section={s} rows={rowsBySection[s.id] || []} columns={columns} cellMap={cellMap}
            statusColumn={statusColumn} open={!collapsed[s.id] || selection.moving} onToggle={() => setCollapsed((c) => ({ ...c, [s.id]: !c[s.id] }))}
            selection={selection} onOpenTask={onOpenTask} onAddTask={grouped ? null : onAddTask} onOpenSection={grouped ? null : onOpenSection}
            sectionActions={grouped ? null : { ...sectionActions, index: i, count: sections.length }} />
        ))}
        </PlannerDragContext>

        {!sections.length && <div className="py-10 text-center text-sm text-muted-foreground">No tasks match the current view.</div>}

        {!grouped && <button onClick={onAddSection} className="flex items-center gap-2.5 px-3 h-12 w-full rounded-xl bg-card border border-border shadow-sm text-sm font-medium text-muted-foreground hover:text-foreground hover:shadow-md transition-all">
          <span className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-500/15 flex items-center justify-center"><AddSectionIcon className="w-4 h-4" /></span>
          <Plus className="w-4 h-4" /> Add Section
        </button>}
      </div>
    </div>
  );
}