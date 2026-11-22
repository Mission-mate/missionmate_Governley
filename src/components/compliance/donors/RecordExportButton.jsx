import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';
import { exportRecordsToExcel, exportRecordsToPdf } from '@/lib/donorExport';

/** Export menu + scope dialog (All / Selected / Active / Archived) for donors or donations. */
export default function RecordExportButton({ kind, items, allItems, isArchived, selectedItems, registerTitle, customColumns, donorName, fieldOptions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState(null);
  const plural = kind.plural.charAt(0).toUpperCase() + kind.plural.slice(1);

  const handleExport = (scope) => {
    const scoped = scope === 'selected' ? selectedItems
      : scope === 'Active' ? allItems.filter((r) => !isArchived(r))
      : scope === 'Archived' ? allItems.filter(isArchived)
      : items;
    const scopeLabel = scope === 'selected' ? `Selected ${plural}` : scope === 'all' ? `All ${plural}` : `${scope} ${plural}`;
    if (format === 'pdf') exportRecordsToPdf(kind, scoped, registerTitle, customColumns, donorName, scopeLabel, fieldOptions);
    else exportRecordsToExcel(kind, scoped, registerTitle, customColumns, donorName, fieldOptions);
    setFormat(null);
  };

  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" onClick={() => setMenuOpen((o) => !o)} />
      {menuOpen && <AssetExportMenu onClose={() => setMenuOpen(false)} onExcel={() => setFormat('excel')} onPdf={() => setFormat('pdf')} />}
      <ExportObligationsDialog isOpen={!!format} format={format || 'pdf'} selectedCount={selectedItems.length} statusOptions={['Active', 'Archived']}
        groupLabel="status" itemLabel={kind.plural} onClose={() => setFormat(null)} onConfirm={handleExport} />
    </div>
  );
}