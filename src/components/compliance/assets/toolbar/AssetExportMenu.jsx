import React from 'react';
import { FileSpreadsheet, FileText } from 'lucide-react';
import ToolbarMenuShell from './ToolbarMenuShell';

export default function AssetExportMenu({ onClose, onExcel, onPdf }) {
  return (
    <ToolbarMenuShell onClose={onClose}>
      <button onClick={() => { onExcel(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
        <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
      </button>
      <button onClick={() => { onPdf(); onClose(); }} className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap">
        <FileText className="w-4 h-4 text-red-600" /> Export to PDF
      </button>
    </ToolbarMenuShell>
  );
}