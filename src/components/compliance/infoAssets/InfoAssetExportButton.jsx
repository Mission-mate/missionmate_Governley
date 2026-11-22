import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';
import { exportInfoAssetsToExcel, exportInfoAssetsToPdf } from '@/lib/infoAssetExport';

/** Export menu + scope dialog for the Information Asset Register (mirrors the Fixed Asset Register). */
export default function InfoAssetExportButton({ items, selectedItems, registerTitle, customColumns }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState(null); // 'pdf' | 'excel'

  const handleExport = (scope) => {
    const scoped = scope === 'all' ? items : scope === 'selected' ? selectedItems : items.filter((a) => a.status === scope);
    const label = scope === 'all' ? 'All Information Assets' : scope === 'selected' ? 'Selected Information Assets' : scope;
    if (format === 'pdf') exportInfoAssetsToPdf(scoped, registerTitle, customColumns, label);
    else exportInfoAssetsToExcel(scoped, registerTitle, customColumns);
    setFormat(null);
  };

  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" onClick={() => setMenuOpen((o) => !o)} />
      {menuOpen && <AssetExportMenu onClose={() => setMenuOpen(false)} onExcel={() => setFormat('excel')} onPdf={() => setFormat('pdf')} />}
      <ExportObligationsDialog
        isOpen={!!format}
        format={format || 'pdf'}
        selectedCount={selectedItems.length}
        statusOptions={['Active', 'Superseded']}
        itemLabel="information assets"
        onClose={() => setFormat(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}