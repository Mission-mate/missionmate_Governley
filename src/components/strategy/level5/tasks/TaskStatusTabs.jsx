import React, { useMemo } from 'react';
import CapsuleTabs from '@/components/board/CapsuleTabs';

export const TASK_STATUSES = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

/** Status filter capsule tabs (with counts) for a task & milestone list. */
export default function TaskStatusTabs({ tasks = [], value, onChange }) {
  const tabs = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const s = t.status || 'Not Started';
      counts[s] = (counts[s] || 0) + 1;
    });
    return [
      { value: 'all', label: 'All', count: tasks.length },
      ...TASK_STATUSES.map((s) => ({ value: s, label: s, count: counts[s] || 0 })),
    ];
  }, [tasks]);

  return <CapsuleTabs animated tabs={tabs} value={value} onChange={onChange} size="sm" />;
}