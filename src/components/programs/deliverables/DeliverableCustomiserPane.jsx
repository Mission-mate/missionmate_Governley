import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import { base44 } from '@/api/base44Client';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import AddColumnModal from '@/components/shared/AddColumnModal';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import { COLUMN_TYPES } from '@/lib/programs/deliverableOptions';
import { useDeliverablesApi } from '@/lib/programs/deliverableApiContext';
import { cleanCustomColumns } from '@/lib/configNormalize';
import PriorityFieldCard from '@/components/strategy/customizer/PriorityFieldCard';
import CustomColumnCard from '@/components/strategy/customizer/CustomColumnCard';
import { FieldEditProvider, useFieldCustomiser } from '@/components/shared/customizer/fieldEditMode';
import SortableColumnList from '@/components/shared/customizer/SortableColumnList';

const SECTION = 'text-xs font-semibold text-muted-foreground uppercase tracking-wide';

/** Deliverables Customiser — mirrors the Strategy "Customise Fields" pane. Saved per field on the owning Program or Project. */
export default function DeliverableCustomiserPane({ isOpen, onClose, ownerRecord, config, onSaved }) {
  const { owner } = useDeliverablesApi();
  const [addOpen, setAddOpen] = useState(false);

  const fc = useFieldCustomiser({
    isOpen,
    load: () => config,
    listKey: 'custom_columns',
    normalize: (d) => ({ ...d, custom_columns: cleanCustomColumns(d.custom_columns) }),
    persist: async (next) => {
      await base44.entities[owner.ownerEntity].update(ownerRecord.id, { deliverable_config: next });
      await onSaved?.();
    },
  });

  const guard = useUnsavedChanges({ draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, enabled: isOpen,
    childOpen: addOpen, closeChild: () => setAddOpen(false), subject: 'field configuration changes' });

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={guard.requestClose}>
        <FieldEditProvider value={fc.value}>
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <CustomisePaneTitle subtitle="Manage Deliverables columns" />
            <CloseButton onClick={() => guard.requestClose()} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <p className={`${SECTION} mb-2`}>System Fields</p>
              <p className="text-xs text-muted-foreground/60 mb-2.5">System fields (🔒) cannot be deleted and their options cannot be edited. Tick to show the column in the table.</p>
              <PriorityFieldCard visible={fc.draft.show_priority} onToggle={(v) => fc.change((d) => ({ ...d, show_priority: v }))} />
            </div>
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className={SECTION}>Custom Columns</p>
                <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} disabled={!!fc.editingId} className="shrink-0"><Plus className="w-3.5 h-3.5" /> Add Column</Button>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">Custom fields support full editing.</p>
              <div className="space-y-2">
                {fc.draft.custom_columns.length === 0 ? (
                  <div className="rounded-lg bg-muted/40 px-4 py-4 text-sm text-muted-foreground text-center">No custom columns yet. Use "+ Add Column" to create one.</div>
                ) : (
                  <SortableColumnList
                    droppableId="deliverable-custom-columns"
                    columns={fc.draft.custom_columns}
                    onReorder={fc.reorderColumns}
                    renderCard={(c, dragHandleProps) => (
                      <CustomColumnCard
                        col={c}
                        showVisibility={false}
                        dragHandleProps={dragHandleProps}
                        savedCol={fc.saved.custom_columns.find((x) => x.id === c.id)}
                        onUpdate={fc.updateColumn}
                        onRemove={() => fc.removeColumn(c.id)}
                      />
                    )}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
        </FieldEditProvider>
      </SlidePane>
      <AddColumnModal isOpen={addOpen} onClose={() => setAddOpen(false)} types={COLUMN_TYPES}
        onCreate={({ title, type, config: cfg }) => fc.addColumn({ id: `col_${Date.now()}`, title, type, config: cfg })} />
      {guard.dialog}
    </>
  );
}