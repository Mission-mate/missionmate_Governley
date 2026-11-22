import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatSubmissionDate } from '@/lib/submissionFormat';

const COLUMNS = [
  { key: 'member_name', label: 'Name', width: 140 },
  { key: 'membership_structure_name', label: 'Membership Plan', width: 140 },
  { key: 'submitted_at', label: 'Date Submitted', width: 110 },
];

const valueFor = (row, key) =>
  key === 'submitted_at'
    ? formatSubmissionDate(row.submitted_at || row.created_date)
    : row[key] || '—';

export function exportSubmissionsExcel(rows = []) {
  const data = rows.map((r) => ({
    Name: valueFor(r, 'member_name'),
    'Membership Plan': valueFor(r, 'membership_structure_name'),
    'Date Submitted': valueFor(r, 'submitted_at'),
  }));
  return writeStyledWorkbook({
    fileName: 'Membership_Submissions.xlsx',
    sheetName: 'Submissions',
    headers: ['Name', 'Membership Plan', 'Date Submitted'],
    rows: data,
  });
}

export function exportSubmissionsPdf(rows = []) {
  exportRegisterPdf({
    title: 'Membership Submissions',
    statusLabel: 'All Submissions',
    summary: [],
    columns: COLUMNS,
    rows,
    cellFor: (row, key) => [[{ kind: 'text', text: valueFor(row, key), bold: key === 'member_name' }]],
  });
}