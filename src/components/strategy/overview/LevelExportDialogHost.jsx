import React from 'react';
import ExportStrategyLevelDialog from './ExportStrategyLevelDialog';
import { LEVELS } from '@/lib/strategyLayers';

/**
 * Wires a level table's useBlockTableView export state to the export dialog.
 * Priorities (Level 3) have no delivery status, so the status section is hidden.
 */
export default function LevelExportDialogHost({ view, order, selectedIds, level }) {
  return (
    <ExportStrategyLevelDialog
      isOpen={!!view.exportFormat}
      format={view.exportFormat || 'pdf'}
      selectedIds={selectedIds}
      hasStatus={level !== LEVELS.PRIORITIES}
      onClose={view.closeExport}
      onConfirm={(scopeIds, statuses, healths) => {
        view.runExport(view.exportFormat, order, scopeIds, statuses, healths);
        view.closeExport();
      }}
    />
  );
}