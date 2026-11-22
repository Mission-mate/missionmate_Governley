import React from 'react';
import { Table, BarChart3 } from 'lucide-react';
import TaskViewToggle from '@/components/strategy/level5/tasks/TaskViewToggle';

const OPTIONS = [
  { id: 'data', label: 'Table', Icon: Table },
  { id: 'charts', label: 'Charts', Icon: BarChart3 },
];

/** Switcher between the reporting data table and its charts (shared spring pill). */
export default function DataViewToggle({ value, onChange }) {
  return <TaskViewToggle value={value} onChange={onChange} options={OPTIONS} />;
}