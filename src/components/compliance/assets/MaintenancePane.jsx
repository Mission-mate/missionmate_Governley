import React, { useState, useEffect } from 'react';
import { guardSave } from '@/lib/saveGuard';
import { format } from 'date-fns';
import SlidePane from '@/components/ui/SlidePane';
import PaneIconHeaderActions from '@/components/shared/PaneIconHeaderActions';
import ViewModeHint from '@/components/shared/ViewModeHint';
import EditFooterActions from '@/components/shared/EditFooterActions';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { draftEqual } from '@/lib/unsavedChanges/draftEqual';
import MaintenanceFields from './MaintenanceFields';

const toForm = (e) => (e
  ? { date: e.date || '', type: e.type || '', title: e.title || '', description: e.description || '', provider: e.provider || '', cost: e.cost ?? '' }
  : { date: format(new Date(), 'yyyy-MM-dd'), type: '', title: '', description: '', provider: '', cost: '' });

/**
 * One pane for a maintenance entry. An existing entry opens view-only and switches to editing in place;
 * Save Changes or Cancel returns it to view-only. Without an `entry` it is the Add form.
 */
export default function MaintenancePane({ isOpen, entry, startEditing = false, onClose, onSave }) {
  const isAdd = !entry;
  const [editing, setEditing] = useState(true);
  const [form, setForm] = useState(toForm(null));
  const [baseline, setBaseline] = useState(form);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { requestClose, dialog } = useUnsavedChanges({
    draft: form, baseline, onClose, saving, enabled: isOpen && editing, subject: 'maintenance changes',
  });
  const dirty = isAdd || !draftEqual(form, baseline);

  useEffect(() => {
    if (!isOpen) return;
    const init = toForm(entry);
    setForm(init); setBaseline(init); setErrors({}); setSaving(false);
    setEditing(!entry || startEditing);
  }, [isOpen, entry?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => { setForm((f) => ({ ...f, [k]: v })); setErrors((e) => ({ ...e, [k]: '' })); };
  const cancel = () => (isAdd ? requestClose() : (setForm(baseline), setErrors({}), setEditing(false)));

  const handleSave = guardSave(setSaving, async () => {
    const e = {};
    if (!form.date) e.date = 'Date is required.';
    if (!form.type) e.type = 'Type is required.';
    if (!form.title.trim()) e.title = 'Title is required.';
    if (Object.keys(e).length) return setErrors(e);
    setSaving(true);
    await onSave(form);
    setBaseline(form);
    setSaving(false);
    if (isAdd) onClose(); else setEditing(false);
  });

  return (
    <>
      {dialog}
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <div className="bg-card h-full flex flex-col shadow-2xl">
          <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">{isAdd ? 'Add Maintenance' : editing ? 'Edit Maintenance' : 'View Maintenance'}</h2>
              <PaneIconHeaderActions showEdit={!isAdd && !editing} onEdit={() => setEditing(true)} onClose={() => requestClose()} />
            </div>
            {!isAdd && <ViewModeHint className="mt-1" editing={editing} />}
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <MaintenanceFields form={form} set={set} errors={errors} edit={editing} />
          </div>
          {editing && (
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
              <EditFooterActions dirty={dirty} onCancel={cancel} onSave={handleSave} saving={saving}
                saveLabel={isAdd ? 'Add Maintenance' : undefined} />
            </div>
          )}
        </div>
      </SlidePane>
    </>
  );
}