import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import AddColumnModal from '@/components/shared/AddColumnModal';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import CustomColumnCard from '@/components/strategy/customizer/CustomColumnCard';
import { STRATEGY_COLUMN_TYPES, newColumnId } from '@/lib/strategy/levelFields';
import { getAssetOptions, getAssetCustomColumns } from '@/lib/assetRegister';
import { saveAssetOptions, cleanupAssetCustomFields } from '@/lib/assetRegisterApi';
import OptionListEditor from './OptionListEditor';
import { cleanCustomColumns } from '@/lib/configNormalize';
import ConfirmDeleteDialog from '@/components/shared/ConfirmDeleteDialog';
import { FieldEditProvider, useFieldCustomiser } from '@/components/shared/customizer/fieldEditMode';
import useAsyncConfirm from '@/components/shared/customizer/useAsyncConfirm';

const FIELDS = [
  { key: 'asset_types', field: 'asset_type', label: 'Asset Type' },
  { key: 'locations', field: 'location', label: 'Location' },
];

/**
 * `systemFields` false = custom columns only (e.g. Information Asset Register); `entity` = item entity to scrub.
 * `columnsKey` = register.config key holding the custom columns. Each field saves on its own.
 */
export default function AssetCustomiserPane({ isOpen, register, onClose, onSaved, systemFields = true, entity, subtitle = 'Manage asset register columns', columnsKey = 'custom_columns', fields = FIELDS, getOptions = getAssetOptions, itemNoun = '' }) {
  const [addOpen, setAddOpen] = useState(false);
  const inUse = useAsyncConfirm();

  // System-field options removed while still assigned to records (only when itemNoun is set).
  const findInUseRemovals = async (prev, next) => {
    const out = [];
    for (const { key, field } of fields) {
      const keep = new Set(next[key].map((o) => o.id));
      const names = prev[key].filter((o) => !keep.has(o.id)).map((o) => o.name);
      if (!names.length) continue;
      const count = await entity.count({ register_id: register.id, [field]: { $in: names } });
      if (count) out.push({ field, names, count });
    }
    return out;
  };

  const fc = useFieldCustomiser({
    isOpen,
    load: () => ({ ...getOptions(register), custom: getAssetCustomColumns(register, columnsKey) }),
    normalize: (d) => {
      const clean = { ...d, custom: cleanCustomColumns(d.custom) };
      if (systemFields) fields.forEach(({ key }) => { clean[key] = d[key].map((o) => ({ ...o, name: o.name.trim() })).filter((o) => o.name); });
      return clean;
    },
    persist: async (next, prev) => {
      if (itemNoun) {
        const removals = await findInUseRemovals(prev, next);
        if (removals.length) {
          if (!(await inUse.ask(removals))) return false;
          for (const { field, names } of removals) {
            await entity.updateMany({ register_id: register.id, [field]: { $in: names } }, { $set: { [field]: null } });
          }
        }
      }
      const options = {};
      const renames = [];
      if (systemFields) fields.forEach(({ key, field }) => {
        options[key] = next[key];
        next[key].forEach((o) => {
          const old = prev[key].find((p) => p.id === o.id);
          if (old && old.name !== o.name) renames.push({ field, from: old.name, to: o.name });
        });
      });
      await cleanupAssetCustomFields(register.id, prev.custom, next.custom, entity);
      await saveAssetOptions(register, { ...options, [columnsKey]: next.custom }, renames, entity);
      await onSaved();
    },
  });

  const { requestClose, dialog } = useUnsavedChanges({
    draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, enabled: isOpen,
    childOpen: addOpen, closeChild: () => setAddOpen(false),
    subject: 'field configuration changes',
  });

  const handleDragEnd = ({ source, destination }) => {
    if (!destination || destination.index === source.index) return;
    fc.reorderColumns(source.index, destination.index);
  };

  const removedNames = inUse.pending?.flatMap((r) => r.names) || [];

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <FieldEditProvider value={fc.value}>
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <CustomisePaneTitle subtitle={subtitle} />
            <CloseButton onClick={requestClose} />
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            {systemFields && <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Fields</p>
              <p className="text-xs text-muted-foreground/60 mb-2.5">System fields (🔒) cannot be deleted. Renaming an option updates existing {itemNoun ? `${itemNoun}s` : 'assets'}.</p>
              <div className="space-y-2">
                {fields.map(({ key, label, noRemove, lockedNames }) => (
                  <OptionListEditor key={key} id={key} label={label} options={fc.draft[key]} lockedNames={lockedNames}
                    onChange={(v) => fc.setDraft((d) => ({ ...d, [key]: v }))}
                    savedIds={new Set(fc.saved[key].map((o) => o.id))}
                    fixedIds={noRemove ? new Set(fc.saved[key].map((o) => o.id)) : undefined} />
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
              <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">Custom fields support full editing.</p>
              {fc.draft.custom.length === 0 ? (
                <div className="rounded-lg bg-muted/40 px-4 py-4 text-sm text-muted-foreground text-center">
                  No custom columns yet. Use "+ Add Column" to create one.
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="asset-custom-columns">
                    {(drop) => (
                      <div ref={drop.innerRef} {...drop.droppableProps}>
                        {fc.draft.custom.map((col, index) => (
                          <Draggable key={col.id} draggableId={col.id} index={index}>
                            {(drag) => (
                              <div ref={drag.innerRef} {...drag.draggableProps} className="pb-2">
                                <CustomColumnCard
                                  col={col}
                                  dragHandleProps={drag.dragHandleProps}
                                  savedCol={fc.saved.custom.find((c) => c.id === col.id)}
                                  onUpdate={fc.updateColumn}
                                  onSetVisible={(v) => fc.setColumnVisible(col.id, v)}
                                  onRemove={() => fc.removeColumn(col.id)}
                                />
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

      <AddColumnModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        types={STRATEGY_COLUMN_TYPES}
        onCreate={({ title, type, config }) => fc.addColumn({ id: newColumnId(), title, type, config })}
      />

      <ConfirmDeleteDialog
        isOpen={!!inUse.pending}
        title="Remove Options"
        confirmLabel="Remove"
        message={inUse.pending && `${removedNames.join(', ')} ${removedNames.length === 1 ? 'is' : 'are'} assigned to ${inUse.pending.reduce((n, r) => n + r.count, 0)} ${itemNoun}(s). Removing will leave the field empty on those ${itemNoun}s.`}
        onConfirm={() => inUse.answer(true)}
        onClose={() => inUse.answer(false)}
      />
      {dialog}
    </>
  );
}