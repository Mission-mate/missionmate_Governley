// Excel / PDF export for the strategy level tables (L3–L7).
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { exportOverviewPdf } from '@/lib/strategy/overviewExport';
import { customValueText } from '@/lib/strategy/levelFields';

const FIELDS = [
  { key: 'health', label: 'Health' },
  { key: 'owner', label: 'Owner' },
  { key: 'status', label: 'Status' },
  { key: 'priority', label: 'Priority' },
];

/** Custom columns configured in the Customiser become extra export columns. */
const customExportColumns = (customCols = []) =>
  customCols.map((column) => ({
    label: column.title || '',
    value: (r) => customValueText(column, r?.custom_fields?.[column.id]),
  }));

/**
 * PDF — reuses the Overview renderer so the record column wraps within its own
 * width (bold title, muted ID · Level · Owner beneath) instead of bleeding into
 * the Health / Status / Priority columns. Custom columns are appended as
 * additional text columns.
 */
export function exportBlocksToPdf(rows, title, customCols = []) {
  const extras = customExportColumns(customCols);
  const items = rows.map((r) => ({
    title: r.title,
    custom_id: r.custom_id,
    levelLabel: r._group ? `${title} · ${r._group}` : title,
    owner: r.owner,
    health: r.health,
    status: r.status,
    priority: r.priority,
    depth: 0,
    extras: extras.map((c) => c.value(r) || ''),
  }));
  exportOverviewPdf(items, title, extras.map((c) => c.label));
}

export function exportBlocksToExcel(rows, title, customCols = []) {
  const grouped = rows.some((r) => r._group);
  exportRegisterExcel({
    title,
    sheetName: 'Records',
    columns: [
      { label: 'Name', value: (r) => r.title || '' },
      { label: 'ID', value: (r) => r.custom_id || '' },
      { label: 'Description', value: (r) => r.content || '' },
      ...(grouped ? [{ label: 'Group', value: (r) => r._group || '' }] : []),
      ...FIELDS.map((f) => ({ label: f.label, value: (r) => r[f.key] || '' })),
      ...customExportColumns(customCols),
    ],
    rows,
  });
}