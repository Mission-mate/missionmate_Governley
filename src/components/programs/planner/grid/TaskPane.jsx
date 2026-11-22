import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import AutoGrowTextarea from '@/components/shared/AutoGrowTextarea';
import SectionCard from '@/components/shared/SectionCard';
import FieldError from '@/components/shared/FieldError';
import ColoredSelect from '@/components/shared/ColoredSelect';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { FieldLabel } from '@/components/programs/CreateProgramModal';
import { readCell, cellKey, saveRowCells, deleteRow, nextOrder } from '@/lib/programs/plannerApi';
import PlannerCell from './PlannerCell';
import PlannerCellInput from './PlannerCellInput';
import PlannerPaneShell from './PlannerPaneShell';
import PaneFooter from './PaneFooter';
import PlannerTaskTabs from './PlannerTaskTabs';
import PlannerTaskWorkspaceBody from './PlannerTaskWorkspaceBody';
import { Button } from '@/components/ui/button';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';

const textareaCls = 'w-full rounded-md border border-input bg-background text-foreground px-3 py-2 text-sm outline-none resize-none overflow-hidden focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50';

export default function TaskPane({ isOpen, row, sectionId, startEditing, plannerId, grid, onClose }) {
  const { sections, columns, cellMap, rowsBySection, refresh } = grid;
  const toDraft = () => ({
    title: row?.title || '', description: row?.description || '', section_id: row?.section_id || sectionId || sections[0]?.id || '',
    cells: Object.fromEntries(columns.map((c) => [c.id, readCell(row && cellMap[cellKey(row.id, c.id)], c)])),
  });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toDraft);
  const [baseline, setBaseline] = useState(toDraft);
  const [showDesc, setShowDesc] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [tab, setTab] = useState('overview');
  // Unsaved edits inside the Notes / Tasks tabs also trigger the discard confirmation.
  const [tabDirty, setTabDirty] = useState(false);
  const note = useNoteActions();
  const guard = useUnsavedChanges({
    draft: { ...(editing ? draft : baseline), tabDirty }, baseline: { ...baseline, tabDirty: false },
    onClose, saving, enabled: isOpen, subject: tab === 'overview' ? 'task changes' : `${tab === 'notes' ? 'note' : tab.replace(/s$/, '')} changes`,
  });
  const switchTab = (v) => guard.requestClose(() => { setTabDirty(false); setTab(v); });

  useEffect(() => {
    if (!isOpen) return;
    const d = toDraft();
    setDraft(d); setBaseline(d); setShowDesc(!!d.description); setError('');
  }, [isOpen, row]); // eslint-disable-line
  // Edit mode is set when a task opens — a refreshed copy of the same task (after Save) keeps it.
  useEffect(() => { if (isOpen) { setTab('overview'); setTabDirty(false); setEditing(!row || startEditing); } }, [isOpen, row?.id]); // eslint-disable-line
  const onOverview = tab === 'overview';
  const expanded = tab === 'notes' || tab === 'tasks';

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const sectionOptions = sections.map((s) => ({ name: s.title, color: 'gray' }));

  const save = async () => {
    if (!draft.title.trim()) { setError('Task title is required.'); return; }
    setSaving(true);
    try {
    const data = { title: draft.title.trim(), description: draft.description, section_id: draft.section_id };
    let id = row?.id;
    if (row) {
      if (draft.section_id !== row.section_id) data.order_index = nextOrder(rowsBySection[draft.section_id] || []);
      await base44.entities.PlannerRow.update(id, data);
    } else {
      id = (await base44.entities.PlannerRow.create({ ...data, planner_id: plannerId, order_index: nextOrder(rowsBySection[draft.section_id] || []) })).id;
    }
    await saveRowCells(plannerId, id, columns, draft.cells, cellMap);
    await refresh();
    } finally { setSaving(false); }
    if (row) { setBaseline(draft); setEditing(false); } else onClose();
  };

  const formDirty = JSON.stringify(draft) !== JSON.stringify(baseline);
  const discard = () => { setDraft(baseline); setShowDesc(!!baseline.description); setError(''); };
  // Cancel restores the saved values and returns to view mode.
  const cancel = () => (row ? (discard(), setEditing(false)) : guard.requestClose());
  // Cancel on the Notes / Checklist / Documents tabs leaves edit mode (guarded) — back to view-only.
  const exitEdit = () => guard.requestClose(() => { discard(); setTabDirty(false); setEditing(false); });
  const sectionTitle = sections.find((s) => s.id === draft.section_id)?.title || '—';

  // Footer per tab, mirroring the Compliance Obligation pane:
  // Overview — Close (view) or Delete + Cancel / Save Changes (edit). Other tabs — edit mode only;
  // Notes saves the open note (and any edited fields), unsaved checklist edits show their own actions.
  const footer = onOverview
    ? (editing
      ? <PaneFooter onDelete={row ? () => setConfirm(true) : null} onCancel={cancel} onSave={save} saving={saving} saveLabel={row ? 'Save Changes' : 'Create Task'} dirty={formDirty} />
      : <Button variant="outline" className="ml-auto" onClick={guard.requestClose}>Close</Button>)
    : (
      <div className="ml-auto flex items-center gap-3">
        {tab === 'notes'
          ? <EditFooterActions dirty={tabDirty || formDirty} onCancel={exitEdit} saving={saving || note.saving}
              onSave={() => note.saveThen(() => (formDirty ? (setTab('overview'), save()) : (setTabDirty(false), setEditing(false))))} />
          : <EditFooterActions dirty={false} onCancel={exitEdit} />}
      </div>
    );

  return (
    <PlannerPaneShell isOpen={isOpen} onClose={guard.requestClose} saving={saving}
      editing={editing} onEdit={row ? () => setEditing(true) : null}
      title={row ? (editing ? 'Edit Task' : 'View Task') : 'New Task'}
      tabs={row && <PlannerTaskTabs rowId={row.id} value={tab} onChange={switchTab} />}
      flush={expanded} showFooter={onOverview || (editing && !(tab === 'tasks' && tabDirty))}
      extra={<>{guard.dialog}<ConfirmDeleteDialog isOpen={confirm} title="Delete Task" overlayClassName="z-[110]"
        message="This permanently deletes the task and its values. This action cannot be undone."
        onClose={() => setConfirm(false)} onConfirm={async () => { await deleteRow(row.id); setConfirm(false); await refresh(); onClose(); }} /></>}
      footer={footer}>
      {!onOverview && row ? <PlannerTaskWorkspaceBody tab={tab} row={row} readOnly={!editing} onDirtyChange={setTabDirty} noteActionsRef={note.actionsRef} /> : <>
      <SectionCard>
        <FieldLabel required={editing} error={error}>Task Title</FieldLabel>
        {editing ? (
          <>
            <AutoGrowTextarea value={draft.title} onChange={(e) => { set({ title: e.target.value }); setError(''); }} autoFocus={!row}
              placeholder="e.g. Draft program logic for stakeholder feedback" className={`${textareaCls} min-h-[38px]`} />
            <FieldError msg={error} />
          </>
        ) : <p className="text-sm text-foreground whitespace-pre-wrap">{row?.title}</p>}

        {editing && showDesc && (
          <div className="mt-4">
            <FieldLabel>Description</FieldLabel>
            <AutoGrowTextarea value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="Add more detail" className={`${textareaCls} min-h-[72px]`} />
          </div>
        )}
        {editing && !showDesc && (
          <button type="button" onClick={() => setShowDesc(true)} className="mt-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80">
            <Plus className="w-3.5 h-3.5" /> Add Description
          </button>
        )}
        {!editing && row?.description && (
          <div className="mt-4"><FieldLabel>Description</FieldLabel><p className="text-sm text-foreground whitespace-pre-wrap">{row.description}</p></div>
        )}

        <div className="mt-4">
          <FieldLabel tip="Sections group related tasks">Section</FieldLabel>
          {editing ? (
            <ColoredSelect value={sectionTitle} allowClear={false} options={sectionOptions} className="bg-background"
              onChange={(name) => set({ section_id: sections.find((s) => s.title === name)?.id || draft.section_id })} />
          ) : <p className="text-sm text-foreground">{sectionTitle}</p>}
        </div>
      </SectionCard>

      {columns.length > 0 && (
        <SectionCard title="Task Details">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            {columns.map((c) => (
              <div key={c.id} className="min-w-0">
                {!(editing && c.type === 'People' && c.system_key !== 'owner') && <FieldLabel>{c.title}</FieldLabel>}
                {editing
                  ? <PlannerCellInput column={c} value={draft.cells[c.id]} onChange={(v) => set({ cells: { ...draft.cells, [c.id]: v } })} />
                  : <PlannerCell column={c} value={draft.cells[c.id]} />}
              </div>
            ))}
          </div>
        </SectionCard>
      )}
      </>}
    </PlannerPaneShell>
  );
}