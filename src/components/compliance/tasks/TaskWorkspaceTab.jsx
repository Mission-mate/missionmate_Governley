import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/components/ui/use-toast';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';
import ConfirmTypeDialog from '@/components/board/documents/ConfirmTypeDialog';
import { COMPLIANCE_TASK_STORE, statusOf, checklistItemsKey } from '@/lib/obligationTasks';
import TaskBulkActionBar from './TaskBulkActionBar';
import TaskGroupView from './TaskGroupView';
import TaskDetailView from './TaskDetailView';

/**
 * Flat checklist for one parent record (compliance obligation, work item, action or task).
 * List edits save immediately; the item detail uses an explicit Save.
 */
export default function TaskWorkspaceTab({
  parentType, parentId, readOnly = false, onDirtyChange,
  store = COMPLIANCE_TASK_STORE, parentFields, onAllCompleteChange,
}) {
  const { listTasks, createTask, updateTask, deleteTask, reorderTasks } = store;
  const qc = useQueryClient();
  const { toast } = useToast();
  const parent = { type: parentType, id: parentId, fields: parentFields };
  const tasksKey = checklistItemsKey(parentType, parentId);

  const { data: tasks = [], isLoading, ...read } = useQuery({ queryKey: tasksKey, queryFn: () => listTasks(parent), enabled: !!parentId });

  const [openTaskId, setOpenTaskId] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [moving, setMoving] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState(null);
  const [taskDirty, setTaskDirty] = useState(false);

  useEffect(() => { onDirtyChange?.(taskDirty); }, [taskDirty, onDirtyChange]);
  useEffect(() => { if (!openTaskId) setTaskDirty(false); }, [openTaskId]);
  const clearSelection = () => { setSelectedTaskId(null); setMoving(false); };
  // View-only mode has no selection circles, so any selection (and move mode) is dropped.
  useEffect(() => { if (readOnly) clearSelection(); }, [readOnly]);
  const toggleSelect = (id) => setSelectedTaskId((cur) => (cur === id ? null : id));
  const openTaskDetail = (id) => { clearSelection(); setOpenTaskId(id); };

  // Optional roll-up: report "every checklist item complete" so the owning task can follow it.
  useEffect(() => {
    if (onAllCompleteChange && !isLoading && tasks.length) onAllCompleteChange(tasks.every((t) => statusOf(t) === 'Completed'));
  }, [tasks, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshTasks = () => qc.invalidateQueries({ queryKey: tasksKey });
  const fail = (description) => toast({ title: 'Error', description, variant: 'destructive' });

  const handleCreateTask = async (fields) => {
    const order_index = tasks.length ? Math.max(...tasks.map((t) => t.order_index ?? 0)) + 1 : 0;
    try { await createTask(parent, { ...fields, order_index }); await refreshTasks(); } catch { fail('Failed to create the item.'); }
  };

  const handleReorderTasks = async (orderedIds) => {
    qc.setQueryData(tasksKey, (old = []) => old.map((t) => {
      const i = orderedIds.indexOf(t.id);
      return i === -1 ? t : { ...t, order_index: i };
    }));
    setMoving(false);
    try { await reorderTasks(orderedIds); } catch { fail('Failed to reorder items.'); }
    refreshTasks();
  };

  const handleUpdateTask = async (id, patch) => {
    qc.setQueryData(tasksKey, (old = []) => old.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    try { await updateTask(id, patch); } catch { fail('Failed to save the item.'); }
    refreshTasks();
  };

  const handleChangeTaskStatus = async (status) => {
    const id = selectedTaskId;
    clearSelection();
    await handleUpdateTask(id, { status });
  };

  const handleDeleteTask = async (id) => {
    try { await deleteTask(id); setOpenTaskId(null); refreshTasks(); } catch { fail('Failed to delete the item.'); }
  };

  const confirmDeleteTask = async () => {
    await handleDeleteTask(deleteTaskTarget.id);
    setDeleteTaskTarget(null);
    clearSelection();
  };

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-card">
        <ModuleLoader className="w-full" />
      </div>
    );
  }

  if (read.isLoadingError) return <LoadError failure={read} title="Couldn’t load tasks" />;

  const openTask = tasks.find((t) => t.id === openTaskId);
  const selectedTask = openTask ? null : tasks.find((t) => t.id === selectedTaskId);

  return (
    <div className="flex min-h-0 h-full w-full overflow-hidden bg-card">
      {openTask ? (
        <TaskDetailView task={openTask} readOnly={readOnly} onBack={() => setOpenTaskId(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} onDirtyChange={setTaskDirty} />
      ) : (
        <TaskGroupView
          tasks={tasks}
          readOnly={readOnly}
          onOpen={openTaskDetail}
          onCreate={handleCreateTask}
          selectedId={selectedTask?.id}
          onToggleSelect={toggleSelect}
          moving={!!selectedTask && moving}
          onReorder={handleReorderTasks}
          actionBar={
            <TaskBulkActionBar
              open={!!selectedTask && !deleteTaskTarget}
              moving={moving}
              currentStatus={selectedTask ? statusOf(selectedTask) : null}
              onView={() => openTaskDetail(selectedTask.id)}
              onMove={() => setMoving((m) => !m)}
              onChangeStatus={handleChangeTaskStatus}
              onDelete={() => { setMoving(false); setDeleteTaskTarget(selectedTask); }}
              onClose={clearSelection}
            />
          }
        />
      )}

      <ConfirmTypeDialog
        isOpen={!!deleteTaskTarget}
        title="Delete Item"
        message="Permanently delete this checklist item? This cannot be recovered."
        keyword="DELETE"
        confirmLabel="Delete"
        onConfirm={confirmDeleteTask}
        onClose={() => setDeleteTaskTarget(null)}
      />
    </div>
  );
}