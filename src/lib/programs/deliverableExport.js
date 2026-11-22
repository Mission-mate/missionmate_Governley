import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { text, badge, DASH } from '@/lib/export/registerCells';
import { statusClass, priorityClass, healthClass } from './deliverableOptions';
import { customFieldText } from '@/components/programs/deliverables/CustomFieldInput';

function columnsFor(config) {
  return [
    { key: 'title', label: 'Deliverable', width: 220, value: (d) => d.title },
    { key: 'owner', label: 'Owner', width: 90, value: (d) => d.owner || '' },
    { key: 'health', label: 'Health', width: 70, value: (d) => d.health || '' },
    { key: 'status', label: 'Status', width: 80, value: (d) => d.status || '' },
    ...(config.show_priority ? [{ key: 'priority', label: 'Priority', width: 65, value: (d) => d.priority || '' }] : []),
    ...config.custom_columns.map((c) => ({ key: `cf:${c.id}`, label: c.title, width: 90, value: (d) => {
      const v = customFieldText(c, d.custom_fields?.[c.id]); return v === '—' ? '' : v; } })),
  ];
}

function cellFor(columns) {
  return (d, key) => {
    const col = columns.find((c) => c.key === key);
    const v = col.value(d);
    if (!v) return [[DASH]];
    if (key === 'status') return [[badge(v, statusClass(v))]];
    if (key === 'priority') return [[badge(v, priorityClass(v))]];
    if (key === 'health') return [[text(v, { classes: healthClass(v) })]];
    return [[text(v)]];
  };
}

/** Export the given deliverables to Excel or PDF, mirroring the register columns. */
export function exportDeliverables(format, { ownerTitle, rows, config }) {
  const columns = columnsFor(config);
  const title = `${ownerTitle} - Deliverables`;
  if (format === 'excel') return exportRegisterExcel({ title, sheetName: 'Deliverables', columns, rows });
  const count = (h) => rows.filter((r) => r.health === h).length;
  return exportRegisterPdf({
    title,
    statusLabel: 'All Deliverables',
    summary: [
      { label: 'Total Deliverables', value: rows.length },
      { label: 'On Track', value: count('On Track') },
      { label: 'At Risk', value: count('At Risk') },
      { label: 'Off Track', value: count('Off Track') },
    ],
    columns,
    rows,
    cellFor: cellFor(columns),
  });
}