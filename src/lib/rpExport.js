import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { text, DASH } from '@/lib/export/registerCells';
import { format, parseISO } from 'date-fns';

const date = (v) => (v ? format(parseISO(v), 'd MMM yyyy') : '');
const term = (p) => (p.appointment_term === 'Custom' && p.interval_value ? `${p.interval_value} ${p.interval_unit || ''}`.trim() : 'Ongoing');
const offices = (p, k) => (p.offices || []).map((o) => o[k]).filter(Boolean).join(', ');

const COLUMNS = [
  { key: 'full_name', label: 'Full Name', width: 130, get: (p) => p.full_name },
  { key: 'person_type', label: 'Type', width: 90, get: (p) => p.person_type },
  { key: 'status', label: 'Status', width: 60, get: (p) => p.status },
  { key: 'appointment_date', label: 'Date Commenced', width: 80, get: (p) => date(p.appointment_date) },
  { key: 'appointment_term', label: 'Appointment Term', width: 80, get: term },
  { key: 'term_expiry_date', label: 'Term Expiry', width: 80, get: (p) => date(p.term_expiry_date) },
  { key: 'office_held', label: 'Office Held', width: 110, get: (p) => offices(p, 'office_held') },
  { key: 'committee', label: 'Committee', width: 120, get: (p) => offices(p, 'committee') },
];
const fileBase = (title) => (title || 'responsible-people').replace(/[^\w-]+/g, '_');

export function exportPeopleToExcel(people, title) {
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Responsible People',
    headers: COLUMNS.map((c) => c.label),
    rows: people.map((p) => Object.fromEntries(COLUMNS.map((c) => [c.label, c.get(p) || '']))),
  });
}

export function exportPeopleToPdf(people, title, statusLabel) {
  exportRegisterPdf({
    title: title || 'Details of Responsible People',
    statusLabel,
    columns: COLUMNS.map(({ key, label, width }) => ({ key, label, width })),
    rows: people,
    cellFor: (p, key) => {
      const v = COLUMNS.find((c) => c.key === key).get(p);
      return [[v ? text(v) : DASH]];
    },
  });
}