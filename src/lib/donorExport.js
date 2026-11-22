import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { text, badge, DASH } from '@/lib/export/registerCells';
import { allFields, displayValue } from '@/lib/donorRegister';
import { OPTION_COLORS } from '@/lib/registerColors';

const fmt = (v) => {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.map(fmt).join(', ');
  if (typeof v === 'object') return v.name || v.label || JSON.stringify(v);
  return String(v);
};
const label = (f) => f.label.replace(' *', '');
const fileBase = (title) => (title || 'donor-register').replace(/[^\w-]+/g, '_');

/** All standard + custom fields as columns: [{ label, value(record) }]. */
function exportColumns(kind, customColumns, donorName, fieldOptions) {
  return [
    ...allFields(kind, fieldOptions).map((f) => ({ f, label: label(f), value: (r) => displayValue(f, r[f.k], donorName) })),
    ...customColumns.map((c) => ({ label: c.title, value: (r) => fmt(r.custom_fields?.[c.id]) })),
  ];
}

export function exportRecordsToExcel(kind, records, title, customColumns, donorName, fieldOptions) {
  const cols = exportColumns(kind, customColumns, donorName, fieldOptions);
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}_${kind.plural}.xlsx`,
    sheetName: kind.key === 'donor' ? 'Donors' : 'Donations',
    headers: cols.map((c) => c.label),
    rows: records.map((r) => Object.fromEntries(cols.map((c) => [c.label, c.value(r)]))),
  });
}

export function exportRecordsToPdf(kind, records, title, customColumns, donorName, statusLabel, fieldOptions) {
  const cols = exportColumns(kind, customColumns, donorName, fieldOptions);
  exportRegisterPdf({
    title: `${title || 'Donor Register'} — ${kind.key === 'donor' ? 'Donors' : 'Donations'}`,
    statusLabel,
    columns: cols.map((c, i) => ({ key: String(i), label: c.label, width: 80 })),
    rows: records,
    cellFor: (r, key) => {
      const c = cols[Number(key)];
      const v = c.value(r);
      if (!v) return [[DASH]];
      const tone = OPTION_COLORS.find((x) => x.id === c.f?.options?.find((o) => o.name === v)?.color);
      return [[tone ? badge(v, `${tone.bg} ${tone.text}`) : text(v)]];
    },
  });
}