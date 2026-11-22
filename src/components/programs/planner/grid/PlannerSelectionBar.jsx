import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import TaskActionBar from '@/components/strategy/level5/tasks/TaskActionBar';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { optionBadgeClass } from '@/components/strategy/customFields/StrategyCustomCell';
import { findStatusColumn, readCell, cellKey, setRowStatus, deleteRow } from '@/lib/programs/plannerApi';

/** Floating actions for the single selected planner task: View, Edit, Move, Change Status, Delete. */
export default function PlannerSelectionBar({ row, grid, plannerId, moving, moveDisabled, onToggleMove, onView, onEdit, onCleared }) {
  const [confirm, setConfirm] = useState(false);
  const statusColumn = findStatusColumn(grid.columns);
  const current = row && statusColumn ? readCell(grid.cellMap[cellKey(row.id, statusColumn.id)], statusColumn) : '';
  const statuses = (statusColumn?.config?.options || []).map((o) => ({ value: o.name, dot: cn(optionBadgeClass(statusColumn, o.name), 'bg-current') }));

  const changeStatus = async (value) => {
    await setRowStatus(plannerId, row.id, statusColumn, value, grid.cellMap);
    await grid.refresh();
  };

  return (
    <>
      <TaskActionBar open={!!row} moving={moving} moveDisabled={moveDisabled} currentStatus={current} statuses={statuses} showStatus={!!statusColumn}
        onView={onView} onEdit={onEdit} onMove={onToggleMove} onChangeStatus={changeStatus} onDelete={() => setConfirm(true)} onClose={onCleared}
        className="sticky bottom-4 z-40" />
      <ConfirmDeleteDialog isOpen={confirm} title="Delete Task" requireKeyword="DELETE"
        message="This permanently deletes the task and its values. This action cannot be undone."
        onClose={() => setConfirm(false)}
        onConfirm={async () => { await deleteRow(row.id); setConfirm(false); onCleared(); await grid.refresh(); }} />
    </>
  );
}