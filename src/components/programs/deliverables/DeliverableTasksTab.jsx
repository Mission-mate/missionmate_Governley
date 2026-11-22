import React from 'react';
import Level5TaskPanel from '@/components/strategy/level5/tasks/Level5TaskPanel';
import { TaskStoreProvider } from '@/lib/tasks/taskStore';
import { useDeliverablesApi } from '@/lib/programs/deliverableApiContext';

/** Tasks & Milestones workspace for one deliverable — shared UI, owner-specific records. */
export default function DeliverableTasksTab({ deliverable, onControls }) {
  const { owner } = useDeliverablesApi();
  return (
    <TaskStoreProvider value={owner.taskStore}>
      <Level5TaskPanel key={deliverable.id} block={deliverable} onControls={onControls} />
    </TaskStoreProvider>
  );
}