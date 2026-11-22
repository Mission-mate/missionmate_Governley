import React, { useState, useEffect, useMemo } from 'react';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useNoteActions from '@/hooks/useNoteActions';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import SlidePane from '@/components/ui/SlidePane';
import CapsuleTabs from '@/components/board/CapsuleTabs';
import SectionCard from '@/components/shared/SectionCard';
import SinglePageDocument from '@/components/notes/pages/SinglePageDocument';
import { listNotePages } from '@/lib/notePages';

import { useReportStore } from '@/lib/tasks/reportStore';
import { nextOrderIndex } from './reportPeriods';
import { toNum } from './reportColumns';
import { CustomCellEditor } from './ReportCellEditor';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import { DisplayCell } from './ReportRow';
/**
 * Right pane for adding or editing a Level 6 reporting row.
 * Periods are named freely by the user — there is no frequency or date driven
 * period generation. New rows are appended and can be reordered in the table.
 */
export default function AddReportPeriodPane({ isOpen, onClose: closeNow, block, columns, unit = '#', existingRows, row, contextLabel, locationReporting = false, initialTab = 'overview', startEditing = false, onSave, onDelete }) {
  const store = useReportStore();
  const loadRowPage = async (rowId) => (await listNotePages(store.notesType, rowId))[0] || null;
  const isChild = !!row?.parent_id;
  const isEdit = !!row;
  // When adding a NEW period under location reporting, the period is created for
  // every location — so data has no single home yet and is hidden until edit.
  const hideData = !isEdit && locationReporting;
  // A period that has location children rolls its data up from them, so when
  // editing such a period only the name is editable and its own data is hidden.
  const hasLocationChildren = useMemo(
    () => isEdit && !isChild && (existingRows || []).some((r) => r.parent_id === row?.id),
    [isEdit, isChild, existingRows, row]
  );

  const [label, setLabel] = useState('');
  const [values, setValues] = useState({ expected: '', actual: '', total_expected: '', baseline: '', custom_values: {} });
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState('overview');
  const [baseline, setBaseline] = useState(null);
  const [notesDirty, setNotesDirty] = useState(false);
  const note = useNoteActions();
  const [isEditing, setIsEditing] = useState(false);
  const editing = isEditing || !isEdit;
  const { requestClose, dialog } = useUnsavedChanges({
    draft: { label, values, notesDirty }, baseline: baseline && { ...baseline, notesDirty: false },
    onClose: closeNow, saving: busy, enabled: isOpen && !!baseline && editing, subject: 'reporting period changes',
  });
  const onClose = () => requestClose();
  // Cancel on an existing row restores the saved values and returns to view mode.
  const cancelEdit = () => (isEdit
    ? (setLabel(baseline.label), setValues(baseline.values), setIsEditing(false))
    : requestClose());
  const dirty = !isEdit || !(baseline && draftEqual({ label, values }, baseline));
  const notesTab = isEdit && tab === 'notes';

  useEffect(() => {
    if (!isOpen) return;
    setIsEditing(startEditing);
    setTab(row ? initialTab : 'overview');
    const initValues = {
      expected: row?.expected ?? '',
      actual: row?.actual ?? '',
      total_expected: row?.total_expected ?? '',
      baseline: row?.baseline ?? '',
      custom_values: { ...(row?.custom_values || {}) }
    };
    setLabel(row?.period_label || '');
    setValues(initValues);
    setBaseline({ label: row?.period_label || '', values: initValues });
  }, [isOpen, row]); // eslint-disable-line react-hooks/exhaustive-deps

  const canSave = isChild || !!label.trim();

  const editableCols = useMemo(() => (columns || []).filter((c) =>
  c.kind === 'system' && (c.key === 'expected' || c.key === 'actual' || c.key === 'baseline') ||
  c.kind === 'optional' && !c.computed ||
  c.kind === 'custom'
  ), [columns]);

  const setVal = (k) => (v) => setValues((s) => ({ ...s, [k]: v }));

  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    try {
      const payload = {};
      // Data fields only when the pane shows them.
      if (!hideData && !hasLocationChildren) {
        payload.expected = toNum(values.expected);
        payload.actual = toNum(values.actual);
        payload.total_expected = toNum(values.total_expected);
        payload.baseline = toNum(values.baseline);
        payload.custom_values = values.custom_values;
      }
      if (!isChild) {
        payload.period_label = label.trim();
        if (!isEdit) payload.order_index = nextOrderIndex(existingRows);
      }
      await onSave(payload);
      // Saved — an existing row returns to view mode with the saved values as the new baseline.
      if (isEdit) { setBaseline({ label, values }); setIsEditing(false); }
      else closeNow();
    } finally {
      setBusy(false);
    }
  };

  const fieldEditor = (col) => {
    if (col.kind === 'custom') {
      return (
        <CustomCellEditor
          column={col}
          value={values.custom_values[col.id]}
          fieldClassName="h-9 bg-background"
          onChange={(v) => setValues((s) => ({ ...s, custom_values: { ...s.custom_values, [col.id]: v } }))} />);


    }
    // Numbers are stored raw; the unit of measure only drives input formatting.
    // '#' Count accepts whole numbers only, '%' and '$' allow decimals.
    const isCount = unit === '#';
    const handle = (e) => {
      const raw = e.target.value;
      setVal(col.key)(isCount ? raw.replace(/[^\d-]/g, '') : raw);
    };
    return (
      <div className="relative">
        {unit === '$' &&
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">$</span>
        }
        <Input
          type="number"
          step={isCount ? '1' : '0.01'}
          value={values[col.key]}
          onChange={handle}
          placeholder="—"
          className={cn('bg-background', unit === '$' && 'pl-6', unit === '%' && 'pr-7')} />

        {unit === '%' &&
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">%</span>
        }
      </div>);


  };

  return (
    <SlidePane isOpen={isOpen} onClose={onClose} className="bg-card shadow-2xl flex flex-col font-body">
      {dialog}
      {/* Header */}
      <div className="px-5 py-4 border-b border-border shrink-0">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">
            {!isEdit ? 'Add Reporting Data' : editing ? 'Edit Reporting Data' : 'View Reporting Data'}
          </p>
          <h2 className="text-base font-semibold text-foreground break-words line-clamp-2 mt-0.5">
            {isChild && contextLabel ? contextLabel : block?.title}
          </h2>
          {isEdit && <ViewModeHint className="mt-1.5" editing={editing} />}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {isEdit && editing && onDelete &&
          <button onClick={() => {closeNow();onDelete(row);}} className="p-1.5 text-destructive hover:text-destructive/80 rounded-md hover:bg-muted"><Trash2 className="w-4 h-4" /></button>
          }
          <PaneIconHeaderActions showEdit={!editing} onEdit={() => setIsEditing(true)} onClose={onClose} />
        </div>
      </div>

      {isEdit &&
      <div className="mt-4">
          <CapsuleTabs animated
          value={tab}
          onChange={setTab}
          className="w-fit"
          tabs={[{ value: 'overview', label: 'Overview' }, { value: 'notes', label: 'Notes' }]} />
        </div>
      }
      </div>

      <div className={cn('flex-1 min-h-0', notesTab ? 'flex' : 'overflow-y-auto px-5 py-4 space-y-4')}>
        {notesTab ?
        <SinglePageDocument
          key={`${row.id}-${editing ? 'edit' : 'view'}`}
          readOnly={!editing}
          objectType={store.notesType}
          objectId={row.id}
          queryKey={['report-row-note', row.id]}
          loadPage={loadRowPage}
          defaultTitle={contextLabel || row.period_label || 'Notes'}
          breadcrumbRoot={row.period_label || block?.title || 'Reporting Period'}
          flush
          onDirtyChange={setNotesDirty}
          actionsRef={note.actionsRef}
          errorLabel="notes" /> :
        <>
        {/* Name — hidden for location child rows (their label is the location) */}
        {!isChild &&
        <SectionCard>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Reporting Period</p>
            {editing ? <>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Q1 2026, March 26, Phase One, Initial Audit" className="bg-background" autoFocus={!isEdit} />
            <p className="mt-1.5 text-[11px] text-muted-foreground">Name this row to suit how you record data. Rows can be reordered in the table.</p>
            </> : <p className={cn('text-sm', label ? 'text-foreground' : 'text-muted-foreground/50')}>{label || '—'}</p>}
          </SectionCard>
        }

        {/* Data fields — hidden while adding a period under location reporting
             (data lives on per-location rows) and on the rolled-up period parent. */}
        {hideData ?
        <p className="text-muted-foreground border border-dashed border-border rounded-lg px-3 py-3 text-xs">
            This row will be added to every category. Record data against each category once it is created.
          </p> :
        hasLocationChildren ?
        <p className="text-muted-foreground border border-dashed border-border rounded-lg px-3 py-3 text-xs">
            Data for this row is rolled up from its categories.
          </p> :
        <SectionCard title="Reporting Data">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4">
              {editableCols.map((col) =>
            <div key={col.kind === 'custom' ? col.id : col.key}>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">{col.kind === 'custom' ? col.title : col.label}</p>
                  {editing ? fieldEditor(col) :
                  <div className="text-sm text-foreground"><DisplayCell col={col} row={values} unit={unit} /></div>}
                </div>
            )}
            </div>
          </SectionCard>
        }
        </>
        }
      </div>

      {/* Footer — on Notes, Save Changes writes the note and any edited fields. */}
      <div className="flex justify-end gap-2 px-5 py-4 border-t border-border">
        {!editing ?
        <Button variant="outline" onClick={onClose}>Close</Button> :
        <EditFooterActions dirty={dirty || notesDirty}
          onCancel={notesTab ? () => requestClose(cancelEdit) : cancelEdit}
          onSave={notesTab ? () => note.saveThen(() => (dirty ? (setTab('overview'), save()) : setIsEditing(false))) : save}
          saving={busy || note.saving} saveDisabled={!canSave} saveLabel={isEdit ? undefined : 'Add Data'} />}
      </div>
    </SlidePane>);

}