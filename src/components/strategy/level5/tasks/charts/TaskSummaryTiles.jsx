import React, { useMemo } from 'react';
import TaskMetricTiles from './TaskMetricTiles';
import { summaryMetrics } from './taskChartData';

/** Summary metric tiles shared by the task list and charts views. */
export default function TaskSummaryTiles({ tasks = [] }) {
  const metrics = useMemo(() => summaryMetrics(tasks), [tasks]);
  return <TaskMetricTiles metrics={metrics} />;
}