import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import AddColumnModal from '@/components/shared/AddColumnModal';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import CustomColumnCard from '@/components/strategy/customizer/CustomColumnCard';
import { STRATEGY_COLUMN_TYPES, newColumnId } from '@/lib/strategy/levelFields';
import { whsAdapter } from '@/lib/whsCustomise';
import OptionListEditor from '@/components/compliance/assets/OptionListEditor';
import { cleanCustomColumns } from '@/lib/configNormalize';
import { FieldEditProvider, useFieldCustomiser } from '@/components/shared/customizer/fieldEditMode';
import useAsyncConfirm from '@/components/shared/customizer/useAsyncConfirm';

/**
 * Customise pane: editable system option lists + custom columns, each saved on its own.
 * Defaults to a WHS tab; other registers pass their own `adapter` ({ def, initialDraft, diff, countInUse, save }).
 */
export default function WhsCustomiserPane({ isOpen, register, tabKey, adapter: adapterProp, label, onClose, onSaved }) {
  const adapter = adapterProp || whsAdapter(tabKey);
  const { def } = adapter;
  const [addOpen, setAddOpen] = useState(false);
  const inUse = useAsyncConfirm();

  const fc = useFieldCustomiser({
    isOpen,
    load: () => adapter.initialDraft(register),
    normalize: (d) => ({ ...d, custom: cleanCustomColumns(d.custom) }),
    persist: async (next, prev) => {
      const diff = adapter.diff(prev, next);
      const used = await adapter.countInUse(register, diff);
      if (used.length && !(await inUse.ask(used))) return false;
      await adapter.save(register, diff, next.custom);
      await onSaved();
    },
  });

  const { requestClose, dialog } = useUnsavedChanges({
    draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, enabled: isOpen,
    childOpen: addOpen, closeChild: () => setAddOpen(false), subject: 'field configuration changes',
  });

  const handleDragEnd = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    fc.reorderColumns(source.index, destination.index);
  };

  const inUseMessage = inUse.pending && (
    `${inUse.pending.map((u) => `${u.count} ${def.noun}${u.count === 1 ? '' : 's'} use a deleted ${u.label} option`).join('; ')}. `
    + 'Their value will be cleared. Reassign them before deleting if you want to keep a value.'
  );

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <FieldEditProvider value={fc.value}>
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <CustomisePaneTitle subtitle={`Manage ${label.toLowerCase()} register columns`} />
            <CloseButton onClick={requestClose} />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {def.system.length > 0 && <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Fields</p>
              <p className="text-xs text-muted-foreground/60 mb-2.5">System fields (🔒) cannot be deleted. Renaming an option updates existing {def.noun}s.</p>
              <div className="space-y-2">
                {def.system.map(({ key, label: l, locked }) => (
                  <OptionListEditor key={key} id={key} label={l} lockedNames={locked} options={fc.draft[key] || []}
                    savedIds={new Set((fc.saved[key] || []).map((o) => o.id))}
                    onChange={(v) => fc.setDraft((d) => ({ ...d, [key]: v }))} />
                ))}
              </div>
            </div>}

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Columns</p>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} disabled={!!fc.editingId} className="shrink-0">
                  <Plus className="w-3.5 h-3.5" /> Add Column
                </Button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">Custom fields appear under Additional Fields and support full editing.</p>
              {fc.draft.custom.length === 0 ? (
                <div className="rounded-lg bg-muted/40 px-4 py-4 text-sm text-muted-foreground text-center">
                  No custom columns yet. Use "+ Add Column" to create one.
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId={`${def.columnsKey}-columns`}>
                    {(drop) => (
                      <div ref={drop.innerRef} {...drop.droppableProps}>
                        {fc.draft.custom.map((col, index) => (
                          <Draggable key={col.id} draggableId={col.id} index={index}>
                            {(drag) => (
                              <div ref={drag.innerRef} {...drag.draggableProps} className="pb-2">
                                <CustomColumnCard col={col} dragHandleProps={drag.dragHandleProps}
                                  savedCol={fc.saved.custom.find((c) => c.id === col.id)}
                                  onUpdate={fc.updateColumn}
                                  onSetVisible={(v) => fc.setColumnVisible(col.id, v)}
                                  onRemove={() => fc.removeColumn(col.id)} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {drop.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        </div>
        </FieldEditProvider>
      </SlidePane>

      <AddColumnModal isOpen={addOpen} onClose={() => setAddOpen(false)} types={STRATEGY_COLUMN_TYPES}
        onCreate={({ title, type, config }) => fc.addColumn({ id: newColumnId(), title, type, config })} />

      <ConfirmDeleteDialog isOpen={!!inUse.pending} title="Option in use" message={inUseMessage}
        confirmLabel="Clear and Delete" onConfirm={() => inUse.answer(true)} onClose={() => inUse.answer(false)} />

      {dialog}
    </>
  );
}