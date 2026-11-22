import React, { useState } from 'react';
import { TASK_STATUSES, statusOf } from '@/lib/obligationTasks';
import TaskProgressBar from './TaskProgressBar';
import StatusFilterTabs from '@/components/shared/StatusFilterTabs';
import ChecklistList from '@/components/shared/checklist/ChecklistList';

/** Flat checklist panel: title, progress, status tabs and the list (with quick add). */
export default function TaskGroupView({
  tasks, readOnly, onOpen, onCreate, selectedId, onToggleSelect, moving, onReorder, actionBar,
}) {
  const [filter, setFilter] = useState('all');

  return (
    <div className="flex-1 min-w-0 flex flex-col min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="pt-3">
          <StatusFilterTabs items={tasks} statuses={TASK_STATUSES} getStatus={statusOf} value={filter} onChange={setFilter} />
        </div>
        <div className="min-w-0 px-6 pt-4 pb-1">
          <TaskProgressBar tasks={tasks} />
        </div>
        <ChecklistList
          items={tasks} statuses={TASK_STATUSES} getStatus={statusOf} filter={filter} readOnly={readOnly}
          selectedId={selectedId} onToggleSelect={onToggleSelect} onOpen={onOpen} moving={moving} onReorder={onReorder}
          onCreate={(fields, status) => onCreate({ ...fields, status })}
        />
      </div>
      {actionBar}
    </div>
  );
}