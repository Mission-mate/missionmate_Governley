import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { exportAttendanceToExcel, exportAttendanceToPdf } from '@/lib/attendanceExport';

export default function AttendanceExportMenu({ rows, meta }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);};
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleExcel = () => {exportAttendanceToExcel(rows, meta);setMenuOpen(false);};
  const handlePdf = () => {exportAttendanceToPdf(rows, meta);setMenuOpen(false);};

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        onClick={() => setMenuOpen((o) => !o)}
        disabled={rows.length === 0}
        className="flex items-center gap-1.5 px-3 h-9 rounded-md border border-input text-sm text-foreground shadow-sm hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed [font-family:'Inter',_ui-sans-serif,_system-ui,_sans-serif] font-normal">
        
        <Download className="w-4 h-4" /> Export
      </button>
      {menuOpen &&
      <div className="animate-dropdown-enter absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-md shadow-lg py-1 z-20">
          <button onClick={handleExcel} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-left">
            <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export to Excel
          </button>
          <button onClick={handlePdf} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50 text-left">
            <FileText className="w-4 h-4 text-destructive" /> Export to PDF
          </button>
        </div>
      }
    </div>);

}