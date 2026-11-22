import React, { useEffect, useState } from 'react';
import { Plus, Lock } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Input } from '@/components/ui/input';
import SectionCard from '@/components/shared/SectionCard';
import FieldError from '@/components/shared/FieldError';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { OptionRow } from '@/components/shared/AddColumnModal';
import ColumnTypeSelect from '@/components/shared/ColumnTypeSelect';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { OPTION_COLORS } from '@/lib/registerColors';
import { FieldLabel } from '@/components/programs/CreateProgramModal';
import { PLANNER_COLUMN_TYPES, deleteColumn, nextOrder, isSystemColumn } from '@/lib/programs/plannerApi';
import PlannerCell from './PlannerCell';
import PlannerPaneShell from './PlannerPaneShell';
import PaneFooter from './PaneFooter';

const SELECTS = ['Single Select', 'Multi Select'];
const blankOption = (i) => ({ name: '', color: OPTION_COLORS[i % OPTION_COLORS.length].id });
const toDraft = (c) => ({ title: c?.title || '', type: c?.type || 'Single Select', options: c?.config?.options?.length ? c.config.options : [blankOption(0), blankOption(1)] });

export default function ColumnPane({ isOpen, column, startEditing, plannerId, columns, onClose, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(toDraft(null));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const baseline = toDraft(column);
  const guard = useUnsavedChanges({ draft: editing ? draft : baseline, baseline, onClose, saving, enabled: isOpen, subject: 'column changes' });

  // Reset when a column opens — a refreshed copy of the same column (after Save) keeps edit mode.
  useEffect(() => { if (isOpen) { setEditing(!column || startEditing); setDraft(toDraft(column)); setError(''); } }, [isOpen, column?.id, startEditing]); // eslint-disable-line

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const isSelect = SELECTS.includes(draft.type);
  const system = isSystemColumn(column);
  // System columns are locked; only the Status column's options can be edited.
  const canEdit = !system || column.system_key === 'status';

  const save = async () => {
    const options = draft.options.filter((o) => o.name.trim()).map((o) => ({ name: o.name.trim(), color: o.color }));
    if (!draft.title.trim()) { setError('Column title is required.'); return; }
    if (isSelect && !options.length) { setError('Add at least one option.'); return; }
    const data = system ? { config: { options } } : { title: draft.title.trim(), type: draft.type, config: isSelect ? { options } : {} };
    setSaving(true);
    try {
    if (column) await base44.entities.PlannerColumn.update(column.id, data);
    else await base44.entities.PlannerColumn.create({ ...data, planner_id: plannerId, order_index: nextOrder(columns) });
    await onSaved();
    } finally { setSaving(false); }
    if (column) { setDraft(toDraft({ ...column, ...data })); setEditing(false); } else onClose();
  };

  // Cancel restores the saved values and returns to view mode.
  const cancel = () => (column ? (setDraft(baseline), setError(''), setEditing(false)) : guard.requestClose());

  return (
    <PlannerPaneShell isOpen={isOpen} onClose={guard.requestClose} saving={saving} editing={editing} onEdit={column && canEdit ? () => setEditing(true) : null}
      title={column ? (editing ? (system ? `Edit ${column.title} Options` : 'Edit Column') : column.title) : 'New Column'}
      extra={<>{guard.dialog}<ConfirmDeleteDialog isOpen={confirm} title="Delete Column" requireKeyword="DELETE" overlayClassName="z-[110]"
        message="This permanently deletes the column and every value entered in it. This action cannot be undone."
        onClose={() => setConfirm(false)} onConfirm={async () => { await deleteColumn(column.id); setConfirm(false); onSaved(); onClose(); }} /></>}
      footer={<PaneFooter onDelete={column && !system ? () => setConfirm(true) : null} onCancel={cancel} onSave={save} saving={saving} saveLabel={column ? 'Save Changes' : 'Create Column'}
        dirty={!column || guard.isDirty} />}>
      <SectionCard title="Column Details">
        {editing && !system ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel required error={error && !draft.title.trim()}>Column Title</FieldLabel>
              <Input value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Budget, Reviewer" className="bg-background" autoFocus />
            </div>
            <div>
              <FieldLabel>Column Type</FieldLabel>
              <ColumnTypeSelect value={draft.type} disabled={!!column} onChange={(v) => set({ type: v })} types={PLANNER_COLUMN_TYPES} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><FieldLabel>Column Title</FieldLabel><p className="text-foreground">{column?.title}</p></div>
            <div><FieldLabel>Column Type</FieldLabel><p className="text-foreground">{column?.type}</p></div>
            {system && <p className="col-span-2 flex items-center gap-1.5 text-xs text-muted-foreground"><Lock className="w-3.5 h-3.5" /> System column — locked{canEdit ? '; only its options can be edited.' : '.'}</p>}
          </div>
        )}
        <FieldError msg={error} />
      </SectionCard>

      {isSelect && (
        <SectionCard title="Options">
          {editing ? (
            <div className="space-y-2">
              {draft.options.map((o, i) => (
                <OptionRow key={i} opt={o} onChange={(v) => set({ options: draft.options.map((x, j) => (j === i ? v : x)) })}
                  onRemove={() => set({ options: draft.options.filter((_, j) => j !== i) })} />
              ))}
              <button type="button" onClick={() => set({ options: [...draft.options, blankOption(draft.options.length)] })}
                className="flex items-center gap-1.5 text-sm font-medium text-primary hover:opacity-80 mt-1">
                <Plus className="w-3.5 h-3.5" /> Add an option
              </button>
            </div>
          ) : (
            <PlannerCell column={{ ...column, type: 'Multi Select' }} value={(column?.config?.options || []).map((o) => o.name)} />
          )}
        </SectionCard>
      )}
    </PlannerPaneShell>
  );
}