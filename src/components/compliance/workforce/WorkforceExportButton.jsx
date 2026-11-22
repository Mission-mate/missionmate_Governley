import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';

/**
 * Export menu + scope dialog (All / Selected / statuses).
 * `onExport(format, scope)` performs the export for the chosen scope.
 */
export default function WorkforceExportButton({ selectedCount, statusOptions, itemLabel, onExport }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState(null);
  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" active={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
      {menuOpen && <AssetExportMenu onClose={() => setMenuOpen(false)} onExcel={() => setFormat('excel')} onPdf={() => setFormat('pdf')} />}
      <ExportObligationsDialog isOpen={!!format} format={format || 'pdf'} selectedCount={selectedCount}
        statusOptions={statusOptions} groupLabel="status" itemLabel={itemLabel}
        onClose={() => setFormat(null)} onConfirm={(scope) => { onExport(format, scope); setFormat(null); }} />
    </div>
  );
}