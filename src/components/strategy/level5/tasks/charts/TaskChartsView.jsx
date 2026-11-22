import React, { useState } from 'react';
import ExecutionVelocityChart from './ExecutionVelocityChart';
import QuarterlyBarChart from './QuarterlyBarChart';
import TaskDrilldownPane from './TaskDrilldownPane';
import { bucketKeyOf } from './taskChartData';

/** Analytics dashboard over a project's tasks & milestones. */
export default function TaskChartsView({ tasks = [], exportRefs }) {
  const [drilldown, setDrilldown] = useState(null);

  if (!tasks.length) {
    return (
      <div className="bg-card border border-border rounded-xl py-16 text-center text-sm text-muted-foreground">
        No tasks or milestones to analyse yet.
      </div>
    );
  }

  const openPane = (chartName, label, items, guide) => setDrilldown({ chartName, label, items, guide });

  const velocityDrilldown = (chartName, label, bucketKey, period) => {
    if (!bucketKey) return;
    const items = tasks.filter((t) => bucketKeyOf(t, period) === bucketKey && (t.status || '') !== 'Completed');
    openPane(chartName, `${label} · behind`, items, 'Activities planned for completion in this period but not yet completed');
  };

  const quarterlyDrilldown = (chartName, label, bucketKey, key, period) => {
    if (!bucketKey) return;
    const completedOnly = key === 'completed';
    const items = tasks.filter((t) => bucketKeyOf(t, period) === bucketKey && ((t.status || '') === 'Completed') === completedOnly);
    openPane(
      chartName,
      `${label} · ${completedOnly ? 'completed' : 'outstanding'}`,
      items,
      completedOnly ? 'Activities due this period that have been completed' : 'Activities due this period that are not yet completed'
    );
  };

  return (
    <div className="space-y-4 pt-3">
      <div className="space-y-4" ref={(n) => { if (exportRefs) exportRefs.current.dashboard = n; }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div ref={(n) => { if (exportRefs) exportRefs.current.velocity = n; }}>
            <ExecutionVelocityChart tasks={tasks} onDrilldown={velocityDrilldown} />
          </div>
          <div ref={(n) => { if (exportRefs) exportRefs.current.quarterly = n; }}>
            <QuarterlyBarChart tasks={tasks} onDrilldown={quarterlyDrilldown} />
          </div>
        </div>
      </div>
      <TaskDrilldownPane drilldown={drilldown} onClose={() => setDrilldown(null)} />
    </div>
  );
}