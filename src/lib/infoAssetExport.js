import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { text, badge, DASH } from '@/lib/export/registerCells';
import { RECORD_TYPE_OPTIONS, INFO_STATUS_OPTIONS, YES_NO_OPTIONS, SECURITY_CLASSIFICATION_OPTIONS, RISK_EXPOSURE_OPTIONS } from '@/lib/infoAssetRegister';

// Same option colours the table's labels use, rendered as PDF badges.
const BADGE_OPTIONS = { record_type: RECORD_TYPE_OPTIONS, status: INFO_STATUS_OPTIONS, personal_information: YES_NO_OPTIONS, security_classification: SECURITY_CLASSIFICATION_OPTIONS, risk_exposure: RISK_EXPOSURE_OPTIONS };
const badgeClasses = (color) => `bg-${color}-100 text-${color}-700`;

const FIELDS = [
  ['title', 'Information Asset'], ['description', 'Description'], ['record_type', 'Record Type'], ['status', 'Status'],
  ['location', 'Location'], ['personal_information', 'Personal Information'], ['national_security', 'National Security Information'],
  ['business_function', 'Business Function'], ['information_owner', 'Information Owner'], ['retention_requirement', 'Information Retention Requirement'],
  ['security_classification', 'Security Classification'], ['confidentiality_impact', 'Confidentiality Impact'],
  ['integrity_impact', 'Integrity Impact'], ['availability_impact', 'Availability Impact'],
  ['risk_exposure', 'Risk Exposure'], ['risk_details', 'Risk Details'],
];
const TABLE_KEYS = ['title', 'record_type', 'status', 'location', 'personal_information', 'business_function', 'security_classification', 'risk_exposure'];
const WIDTHS = { title: 200, record_type: 80, status: 75, location: 90, personal_information: 95, business_function: 95, security_classification: 100, risk_exposure: 85 };

const fmt = (v) => {
  if (v == null || v === '') return '';
  if (Array.isArray(v)) return v.map(fmt).join(', ');
  if (typeof v === 'object') return v.name || v.label || JSON.stringify(v);
  return String(v);
};
const valueOf = (a, key, custom) => fmt(custom ? a.custom_fields?.[key] : a[key]);
const fileBase = (title) => (title || 'information-asset-register').replace(/[^\w-]+/g, '_');

export function exportInfoAssetsToExcel(assets, title, customColumns) {
  const cols = [...FIELDS.map(([k, label]) => ({ k, label })), ...customColumns.map((c) => ({ k: c.id, label: c.title, custom: true }))];
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`,
    sheetName: 'Information Assets',
    headers: cols.map((c) => c.label),
    rows: assets.map((a) => Object.fromEntries(cols.map((c) => [c.label, valueOf(a, c.k, c.custom)]))),
  });
}

export function exportInfoAssetsToPdf(assets, title, customColumns, statusLabel) {
  const labels = Object.fromEntries(FIELDS);
  const customIds = new Set(customColumns.map((c) => c.id));
  const columns = [
    ...TABLE_KEYS.map((k) => ({ key: k, label: labels[k], width: WIDTHS[k] })),
    ...customColumns.map((c) => ({ key: c.id, label: c.title, width: 100 })),
  ];
  exportRegisterPdf({
    title: title || 'Information Asset Register',
    statusLabel,
    columns,
    rows: assets,
    cellFor: (a, key) => {
      const v = valueOf(a, key, customIds.has(key));
      if (!v) return [[DASH]];
      const color = BADGE_OPTIONS[key]?.find((o) => o.name === v)?.color;
      return [[color ? badge(v, badgeClasses(color)) : text(v)]];
    },
  });
}