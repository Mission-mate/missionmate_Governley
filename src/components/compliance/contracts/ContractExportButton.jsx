import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';
import { exportContractsToExcel, exportContractsToPdf } from '@/lib/contractExport';
import { CONTRACT_STATUS_OPTIONS } from '@/lib/contractRegister';

/** Export menu + scope dialog for the Contract Register. */
export default function ContractExportButton({ items, allItems, selectedItems, registerTitle, typeOptions }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState(null); // 'pdf' | 'excel'

  const handleExport = (scope) => {
    const scoped = scope === 'all' ? items : scope === 'selected' ? selectedItems : allItems.filter((c) => (c.status || 'Active') === scope);
    if (format === 'pdf') exportContractsToPdf(scoped, registerTitle, typeOptions);
    else exportContractsToExcel(scoped, registerTitle);
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
        statusOptions={CONTRACT_STATUS_OPTIONS.map((o) => o.name)}
        groupLabel="status"
        itemLabel="contracts"
        onClose={() => setFormat(null)}
        onConfirm={handleExport}
      />
    </div>
  );
}