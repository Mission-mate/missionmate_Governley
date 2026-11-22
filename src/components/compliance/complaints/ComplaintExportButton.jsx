import React, { useState } from 'react';
import { Download } from 'lucide-react';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import ExportObligationsDialog from '@/components/compliance/ExportObligationsDialog';
import AssetExportMenu from '@/components/compliance/assets/toolbar/AssetExportMenu';
import { exportComplaintsToExcel, exportComplaintsToPdf } from '@/lib/complaintExport';

/** Export menu + scope dialog (All / Selected / Open / Closed) for the Complaints Register. */
export default function ComplaintExportButton({ items, selectedItems, registerTitle, customColumns }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [format, setFormat] = useState(null);

  const handleExport = (scope) => {
    const scoped = scope === 'all' ? items : scope === 'selected' ? selectedItems : items.filter((c) => c.status === scope);
    if (format === 'pdf') exportComplaintsToPdf(scoped, registerTitle, customColumns);
    else exportComplaintsToExcel(scoped, registerTitle, customColumns);
    setFormat(null);
  };

  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" active={menuOpen} onClick={() => setMenuOpen((o) => !o)} />
      {menuOpen && <AssetExportMenu onClose={() => setMenuOpen(false)} onExcel={() => setFormat('excel')} onPdf={() => setFormat('pdf')} />}
      <ExportObligationsDialog isOpen={!!format} format={format || 'pdf'} selectedCount={selectedItems.length}
        statusOptions={['Open', 'Closed']} groupLabel="status" itemLabel="complaints"
        onClose={() => setFormat(null)} onConfirm={handleExport} />
    </div>
  );
}