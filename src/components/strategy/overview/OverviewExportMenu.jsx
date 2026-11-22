import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';
import ToolbarButton from '@/components/shared/table/ToolbarButton';

/** Export dropdown for the Overview tab — matches the level table toolbar export button. */
export default function OverviewExportMenu({ onExport }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" onClick={() => setOpen((o) => !o)} />
      {open && (
        <ToolbarMenu onClose={() => setOpen(false)}>
          <button onClick={() => { onExport('excel'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
          </button>
          <button onClick={() => { onExport('pdf'); setOpen(false); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
            <FileText className="w-4 h-4 text-red-600" /> Export to PDF
          </button>
        </ToolbarMenu>
      )}
    </div>
  );
}