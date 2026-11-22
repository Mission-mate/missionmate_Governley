// Shared Excel writer — every export in the app goes through here so all
// workbooks share one look: Arial 10 everywhere, bold light-grey header row,
// frozen header.
import ExcelJS from 'exceljs';

const FONT = { name: 'Arial', size: 10 };
const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

const defaultWidth = (label) => Math.max(String(label).length + 2, 16);

/**
 * Write and download a styled single-sheet workbook.
 *
 * @param {string}   fileName   Full download name, including `.xlsx`.
 * @param {string}   sheetName  Worksheet tab name.
 * @param {string[]} headers    Ordered column labels (also the row object keys).
 * @param {object[]} rows       Row objects keyed by header label.
 * @param {number[]} [widths]   Optional per-column widths; defaults from label length.
 * @param {any[][]}  [preRows]  Optional plain rows rendered above the table (no fill/bold).
 * @param {(row: object, header: string) => ({ color?: string, wrapText?: boolean, numFmt?: string }|void)} [cellStyle]
 *        Optional per-cell override, e.g. red text for an overdue date, or a currency number
 *        format so numeric cells display like the PDF. `color` is an ARGB string.
 */
export async function writeStyledWorkbook({ fileName, sheetName = 'Sheet1', headers, rows, widths, preRows = [], cellStyle }) {
  const book = new ExcelJS.Workbook();
  const sheet = book.addWorksheet(sheetName);

  preRows.forEach((cells) => {
    const row = sheet.addRow(Array.isArray(cells) ? cells : [cells]);
    row.eachCell((cell) => { cell.font = { ...FONT }; });
  });

  const headerRow = sheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.font = { ...FONT, bold: true };
    cell.fill = HEADER_FILL;
  });

  rows.forEach((row) => {
    const added = sheet.addRow(headers.map((h) => (row?.[h] ?? '')));
    added.eachCell((cell, colNumber) => {
      cell.font = { ...FONT };
      const style = cellStyle?.(row, headers[colNumber - 1]);
      if (style?.color) cell.font = { ...cell.font, color: { argb: style.color } };
      if (style?.wrapText) cell.alignment = { ...(cell.alignment || {}), wrapText: true, vertical: 'top' };
      if (style?.numFmt) cell.numFmt = style.numFmt;
    });
  });

  headers.forEach((h, i) => {
    sheet.getColumn(i + 1).width = widths?.[i] ?? defaultWidth(h);
  });

  // Keep the table header visible while scrolling.
  sheet.views = [{ state: 'frozen', ySplit: preRows.length + 1 }];

  const buffer = await book.xlsx.writeBuffer();
  const url = URL.createObjectURL(new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}