import React from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ToolbarButton from '@/components/shared/table/ToolbarButton';

/** Export dropdown using the standard table-toolbar button style. */
export default function ExportToolbarMenu({ onExportExcel, onExportPdf, exporting, className }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          icon={Download}
          label={exporting ? 'Exporting...' : 'Export'}
          disabled={exporting}
          className={className}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem onClick={onExportExcel}>
          <FileSpreadsheet className="w-4 h-4 mr-2 text-green-600" />
          Export to Excel
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onExportPdf}>
          <FileText className="w-4 h-4 mr-2 text-red-600" />
          Export to PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}