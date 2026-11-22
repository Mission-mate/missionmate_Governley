import React from 'react';
import Level6ReportPanel from '@/components/strategy/level6/report/Level6ReportPanel';
import { ReportStoreProvider } from '@/lib/tasks/reportStore';
import { useDeliverablesApi } from '@/lib/programs/deliverableApiContext';

/** Measures workspace for one deliverable — shared Data UI, owner-specific records. */
export default function DeliverableDataTab({ deliverable }) {
  const { owner } = useDeliverablesApi();
  return (
    <ReportStoreProvider value={owner.reportStore}>
      <Level6ReportPanel key={deliverable.id} block={deliverable} view="count" showSwitcher={false} />
    </ReportStoreProvider>
  );
}