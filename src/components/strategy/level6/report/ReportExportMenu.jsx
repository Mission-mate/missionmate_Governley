import React, { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Presentation } from 'lucide-react';
import ToolbarMenu from '@/components/shared/table/ToolbarMenu';
import ToolbarButton from '@/components/shared/table/ToolbarButton';

/** Export dropdown for the Data Reporting toolbar — matches the Tasks & Milestones export button. */
export default function ReportExportMenu({ chartMode, onPdf, onExcel, onPpt }) {
  const [open, setOpen] = useState(false);
  const item = 'w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-muted/50 text-left whitespace-nowrap';

  return (
    <div className="relative">
      <ToolbarButton icon={Download} label="Export" onClick={() => setOpen((o) => !o)} />
      {open && (
        <ToolbarMenu onClose={() => setOpen(false)}>
          {chartMode ? (
            <>
              <button onClick={() => { onPdf(); setOpen(false); }} className={item}>
                <FileText className="w-4 h-4 text-red-600" /> Download PDF
              </button>
              <button onClick={() => { onPpt(); setOpen(false); }} className={item}>
                <Presentation className="w-4 h-4 text-orange-600" /> Download PPT
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { onExcel(); setOpen(false); }} className={item}>
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
              </button>
              <button onClick={() => { onPdf(); setOpen(false); }} className={item}>
                <FileText className="w-4 h-4 text-red-600" /> Export to PDF
              </button>
            </>
          )}
        </ToolbarMenu>
      )}
    </div>
  );
}