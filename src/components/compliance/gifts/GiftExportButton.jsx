import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';
import { exportGiftsToExcel, exportGiftsToPdf } from '@/lib/giftExport';

/** Export menu + scope dialog for the Gift, Benefits and Hospitality Register. */
export default function GiftExportButton({ items, selectedItems, registerTitle }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState(null); // 'pdf' | 'excel'

  const handleExport = (scope) => {
    const scoped = scope === 'all' ? items : scope === 'selected' ? selectedItems : items.filter((g) => g.gift_type === scope);
    if (format === 'pdf') exportGiftsToPdf(scoped, registerTitle);
    else exportGiftsToExcel(scoped, registerTitle);
    setFormat(null);
  };

  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" active={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
      {menuOpen && <AssetExportMenu onClose={() => setMenuOpen(false)} onExcel={() => setFormat('excel')} onPdf={() => setFormat('pdf')} />}
      <ExportObligationsDialog
        isOpen={!!format}
        format={format || 'pdf'}
        selectedCount={selectedItems.length}
        statusOptions={['Gift', 'Benefit']}
        groupLabel="type"
        itemLabel="gifts and benefits"
        onClose={() => setFormat(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}