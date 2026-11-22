import React, { useState } from 'react';
import { Pencil, Trash2, Lock } from 'lucide-react';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { customColumns, deleteColumn } from '@/lib/programs/plannerApi';

const HEAD = 'text-[11px] font-semibold text-muted-foreground uppercase tracking-wide';
const TYPE = 'text-[10px] font-semibold text-muted-foreground/70 uppercase tracking-wide';
const ROW = 'flex items-center gap-2 px-3 py-2.5 bg-card';

/** Planner Manage Columns: locked system columns (Status options editable) and custom columns. No add here. */
export default function PlannerManageColumnsPane({ isOpen, onClose, columns, onEdit, onDeleted }) {
  const [target, setTarget] = useState(null);
  const system = columns.filter((c) => c.system_key);
  const custom = customColumns(columns);

  return (
    <SlidePane isOpen={isOpen} onClose={onClose} className="bg-card shadow-2xl flex flex-col font-body">
      <ConfirmDeleteDialog isOpen={!!target} title="Delete Column" requireKeyword="DELETE" overlayClassName="z-[110]"
        message="This permanently deletes the column and every value entered in it. This action cannot be undone."
        onClose={() => setTarget(null)} onConfirm={async () => { await deleteColumn(target.id); setTarget(null); await onDeleted(); }} />
      <div className="flex items-start justify-between px-5 pt-5 pb-2">
        <h2 className="text-lg font-bold text-foreground">Manage Columns</h2>
        <CloseButton onClick={onClose} className="shrink-0" />
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
        <div>
          <p className={HEAD}>System Columns</p>
          <p className="text-xs text-muted-foreground mt-1 mb-2">System fields are locked. Status options can be edited.</p>
          <div className="border border-border rounded-lg divide-y divide-border">
            {system.map((c) => (
              <div key={c.id} className={ROW}>
                <span className="text-sm text-foreground flex-1 truncate">{c.title}</span>
                <span className={TYPE}>{c.type}</span>
                {c.system_key === 'status' && (
                  <button onClick={() => onEdit(c)} title="Edit options" className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                )}
                <span className="p-0.5 text-muted-foreground/40" title="Locked — cannot be deleted"><Lock className="w-3.5 h-3.5" /></span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className={HEAD}>Custom Columns</p>
          <p className="text-xs text-muted-foreground mt-1 mb-2">Custom fields support full editing. Add new columns from the "+ Add" menu.</p>
          {custom.length === 0 ? (
            <p className="text-muted-foreground bg-muted rounded-lg px-3 py-4 text-center text-xs">No custom columns yet.</p>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border">
              {custom.map((c) => (
                <div key={c.id} className={ROW}>
                  <span className="text-sm text-foreground flex-1 truncate">{c.title}</span>
                  <span className={TYPE}>{c.type}</span>
                  <button onClick={() => onEdit(c)} title="Edit" className="p-0.5 text-muted-foreground hover:text-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => setTarget(c)} title="Delete" className="p-0.5 text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SlidePane>
  );
}