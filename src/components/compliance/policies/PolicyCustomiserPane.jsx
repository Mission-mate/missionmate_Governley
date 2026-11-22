import React, { useState } from 'react';
import SlidePane from '@/components/ui/SlidePane';
import CloseButton from '@/components/shared/CloseButton';
import { FieldEditProvider, useFieldCustomiser } from '@/components/shared/customizer/fieldEditMode';
import AddColumnModal from '@/components/shared/AddColumnModal';
import useUnsavedChanges from '@/hooks/useUnsavedChanges';
import OptionListEditor from '@/components/compliance/assets/OptionListEditor';
import { STRATEGY_COLUMN_TYPES, newColumnId } from '@/lib/strategy/levelFields';
import { cleanCustomColumns } from '@/lib/configNormalize';
import { SEEDED_DOC_TYPES, savePolicyConfig } from '@/lib/policies';
import PolicyCustomColumnList from './PolicyCustomColumnList';

const initial = (types, columns) => ({ types: types.map((name, i) => ({ id: `t${i}`, name })), custom: columns });

const normalize = (d) => ({
  types: d.types.map((o) => ({ ...o, name: o.name.trim() })).filter((o) => o.name),
  custom: cleanCustomColumns(d.custom),
});

import CustomisePaneTitle from '@/components/shared/customizer/CustomisePaneTitle';

/** Customise Fields pane for Policy Management: Document Type options plus custom columns. Each field saves on its own. */
export default function PolicyCustomiserPane({ isOpen, onClose, onSaved, types, columns, docs }) {
  const [addOpen, setAddOpen] = useState(false);

  const fc = useFieldCustomiser({
    isOpen,
    load: () => initial(types, columns),
    normalize,
    persist: async (next, prev) => {
      const renames = next.types
        .map((o) => ({ from: prev.types.find((p) => p.id === o.id)?.name, to: o.name }))
        .filter((r) => r.from && r.from !== r.to);
      await savePolicyConfig({ types: [...new Set(next.types.map((o) => o.name))], columns: next.custom }, renames);
      await onSaved();
    },
  });

  const { requestClose, dialog } = useUnsavedChanges({
    draft: fc.draft, baseline: fc.saved, onClose, saving: fc.saving, enabled: isOpen,
    childOpen: addOpen, closeChild: () => setAddOpen(false), subject: 'field configuration changes',
  });

  // Types in use by a document stay renamable but cannot be removed.
  const inUse = new Set(fc.saved.types.filter((o) => docs.some((d) => d.document_type === o.name)).map((o) => o.id));
  const savedTypeIds = new Set(fc.saved.types.map((o) => o.id));

  return (
    <>
      <SlidePane isOpen={isOpen} onClose={requestClose}>
        <FieldEditProvider value={fc.value}>
        <div className="h-full bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
            <CustomisePaneTitle subtitle="Manage policy management columns" />
            <CloseButton onClick={requestClose} />
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">System Fields</p>
              <p className="text-xs text-muted-foreground/60 mb-2.5">System fields (🔒) cannot be deleted. Renaming an option updates existing documents.</p>
              <OptionListEditor id="types" label="Document Type" options={fc.draft.types} lockedNames={SEEDED_DOC_TYPES} fixedIds={inUse} savedIds={savedTypeIds}
                onChange={(v) => fc.setDraft((d) => ({ ...d, types: v }))} />
            </div>
            <PolicyCustomColumnList fc={fc} onAdd={() => setAddOpen(true)} />
          </div>
        </div>
        </FieldEditProvider>
      </SlidePane>
      <AddColumnModal isOpen={addOpen} onClose={() => setAddOpen(false)} types={STRATEGY_COLUMN_TYPES}
        onCreate={({ title, type, config }) => fc.addColumn({ id: newColumnId(), title, type, config })} />
      {dialog}
    </>
  );
}