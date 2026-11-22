import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';

/**
 * Standard spreadsheet export: one column per field, Arial 10 throughout.
 * @param columns [{ label, value(row) }]
 */
export function exportRegisterExcel({ title, sheetName = 'Register', columns, rows }) {
  const headers = columns.map((c) => c.label);
  const data = rows.map((row) => {
    const obj = {};
    columns.forEach((c) => { obj[c.label] = c.value(row) ?? ''; });
    return obj;
  });

  return writeStyledWorkbook({
    fileName: `${title.replace(/[^\w-]+/g, '_')}.xlsx`,
    sheetName,
    headers,
    rows: data,
    widths: columns.map((c) => Math.max(14, Math.min(50, c.label.length + 8))),
  });
}