import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ELEVATED_SECTION } from '@/components/shared/cardStyles';
import SelectableCardList from './SelectableCardList';
import ControlPane from './ControlPane';
import { CONTROL_COLUMNS } from './riskTableColumns';
import DeleteControlDialog from './DeleteControlDialog';
import { newControl } from './controlConstants';

// Self-contained Controls container — Add Control + slide-pane CRUD.
// `initialControl` ({ id, mode }) deep-links a control's pane open on first render.
export default function ControlsContainer({ risk, onSave, initialControl }) {
  const controls = risk.existing_controls || [];
  const [pane, setPane] = useState(() => {
    const control = initialControl && controls.find((c) => c.id === initialControl.id);
    return control
      ? { open: true, control, startInEdit: initialControl.mode === 'edit', isNew: false }
      : { open: false, control: null, startInEdit: false, isNew: false };
  });
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Changes are sent per control, so other controls are never overwritten.
  const persist = (op) => onSave({ arrayOps: [{ field: 'existing_controls', ...op }] });

  const openAdd = () => setPane({ open: true, control: newControl(), startInEdit: true, isNew: true });
  const openView = (c) => setPane({ open: true, control: c, startInEdit: false, isNew: false });
  const openEdit = (c) => setPane({ open: true, control: c, startInEdit: true, isNew: false });
  const closePane = () => setPane({ open: false, control: null, startInEdit: false, isNew: false });

  // A new control closes once added; an existing one stays open in edit mode, with the
  // saved entry as the base for its next save. Reloading on a conflict closes the pane.
  const handleSave = async (entry) => {
    const saved = await persist({ upserts: [{ item: entry, base: pane.isNew ? null : pane.control }] });
    if (pane.isNew || !saved) closePane();
    else setPane((p) => ({ ...p, control: entry }));
    return saved;
  };

  const handleDelete = async () => {
    await persist({ removes: [deleteTarget.id] });
    setDeleteTarget(null);
  };

  return (
    <div className={ELEVATED_SECTION}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">Controls</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Identify the existing controls and measures currently in place to manage this risk
          </p>
        </div>
        <Button size="sm" onClick={openAdd} className="gap-1.5 shrink-0 text-sm">
          <Plus className="w-4 h-4" /> Add Control
        </Button>
      </div>

      {controls.length === 0 ?
      <div className="border border-dashed border-border rounded-xl p-10 text-center">
          <p className="text-sm text-muted-foreground">No existing controls recorded.</p>
        </div> :

      <SelectableCardList
        items={controls}
        onView={openView}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
        columns={CONTROL_COLUMNS} />
      }

      <ControlPane
        open={pane.open}
        control={pane.control}
        startInEdit={pane.startInEdit}
        isNew={pane.isNew}
        onSave={handleSave}
        onClose={closePane} />
      

      <DeleteControlDialog
        isOpen={!!deleteTarget}
        name={deleteTarget?.control}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} />
      
    </div>);

}