import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';
import SlidePane from '@/components/ui/SlidePane';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import AddColumnModal from '@/components/shared/AddColumnModal';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import PriorityFieldCard from './PriorityFieldCard';
import SystemSelectFieldCard from './SystemSelectFieldCard';
import CustomColumnCard from './CustomColumnCard';
import SortableColumnList from '@/components/shared/customizer/SortableColumnList';
import { FieldEditProvider, useFieldCustomiser } from '@/components/shared/customizer/fieldEditMode';
import {
  STRATEGY_COLUMN_TYPES,
  getLevelFieldConfig,
  levelHasPriority,
  levelSystemFields,
  normalizeLevelFieldConfig,
  saveLevelFieldConfig,
  newColumnId,
  fieldConfigSnapshot,
  cleanupCustomFieldData,
} from '@/lib/strategy/levelFields';

/** Strategy Customiser — Priority visibility + custom columns for one level. Each field saves on its own. */
export default function StrategyFieldConfigPane({ strategy, level, levelName, onClose, onSaved }) {
  const [addOpen, setAddOpen] = useState(false);
  const hasPriority = levelHasPriority(level);

  const systemFields = levelSystemFields(level);

  const fc = useFieldCustomiser({
    load: () => getLevelFieldConfig(strategy, level),
    normalize: (cfg) => normalizeLevelFieldConfig(level, cfg),
    persist: async (next, prev) => {
      // Scrub orphaned values first so a deleted column can't leave data behind.
      await cleanupCustomFieldData(strategy.id, level, prev, next);
      await saveLevelFieldConfig(strategy, level, next);
      await onSaved?.();
    },
  });

  const { requestClose, dialog } = useUnsavedChanges({
    draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, select: fieldConfigSnapshot,
    childOpen: addOpen, closeChild: () => setAddOpen(false),
    subject: 'field configuration changes',
  });

  return (
    <>
    <SlidePane isOpen onClose={requestClose}>
      <FieldEditProvider value={fc.value}>
      <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <CustomisePaneTitle subtitle={`Manage ${levelName} columns`} />
          <CloseButton onClick={requestClose} />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {hasPriority && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Fields</p>
              <p className="text-xs text-muted-foreground/60 mb-2.5">
                {systemFields.length
                  ? 'System fields (🔒) cannot be deleted. Priority options are fixed; the other options can be renamed and recoloured, but not removed. Tick to show the column in the table.'
                  : 'System fields (🔒) cannot be deleted and their options cannot be edited. Tick to show the column in the table.'}
              </p>
              <div className="space-y-2">
                <PriorityFieldCard
                  visible={fc.draft.priority_visible}
                  onToggle={(v) => fc.change((d) => ({ ...d, priority_visible: v }))}
                />
                {systemFields.map((def) => (
                  <SystemSelectFieldCard
                    key={def.id}
                    def={def}
                    field={fc.draft[def.id]}
                    savedField={fc.saved[def.id]}
                    onToggle={(v) => fc.change((d) => ({ ...d, [def.id]: { ...d[def.id], table_visible: v } }))}
                    onChange={(field) => fc.setDraft((d) => ({ ...d, [def.id]: field }))}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Columns</p>
              <Button variant="outline" size="sm" onClick={() => setAddOpen(true)} disabled={!!fc.editingId} className="shrink-0">
                <Plus className="w-3.5 h-3.5" /> Add Column
              </Button>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1.5 mb-2.5">Custom fields support full editing.</p>
            <div className="space-y-2">
              {fc.draft.custom.length === 0 ? (
                <div className="rounded-lg bg-muted/40 px-4 py-4 text-sm text-muted-foreground text-center">
                  No custom columns yet. Use "+ Add Column" to create one.
                </div>
              ) : (
                <SortableColumnList
                  droppableId="strategy-custom-columns"
                  columns={fc.draft.custom}
                  onReorder={fc.reorderColumns}
                  renderCard={(col, dragHandleProps) => (
                    <CustomColumnCard
                      col={col}
                      dragHandleProps={dragHandleProps}
                      savedCol={fc.saved.custom.find((c) => c.id === col.id)}
                      onUpdate={fc.updateColumn}
                      onSetVisible={(v) => fc.setColumnVisible(col.id, v)}
                      onRemove={() => fc.removeColumn(col.id)}
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

      <AddColumnModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        types={STRATEGY_COLUMN_TYPES}
        onCreate={({ title, type, config }) => fc.addColumn({ id: newColumnId(), title, type, config })}
      />

      {dialog}
    </>
  );
}