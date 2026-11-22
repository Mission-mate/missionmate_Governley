import { exportRegisterPdf } from '@/lib/export/registerPdf';
import { exportRegisterExcel } from '@/lib/export/registerExcel';
import { text, badge, person, caption, DASH, stripHtml } from '@/lib/export/registerCells';
import { EFFECTIVENESS_STYLES } from '@/components/risk/detail/controlConstants';
import { OPTION_COLORS } from '@/lib/registerColors';

// Mirrors the visible columns (and widths) of ControlsRegisterGrid.
const COLUMNS = [
  { key: 'control', label: 'Risk Controls', width: 360 },
  { key: 'design_effectiveness', label: 'Design Effectiveness', width: 160 },
  { key: 'operating_effectiveness', label: 'Operating Effectiveness', width: 170 },
];

const categoryClasses = (value, options = []) => {
  const opt = (options || []).find((o) => (typeof o === 'object' ? o.name : o) === value);
  const def = OPTION_COLORS.find((c) => c.id === opt?.color);
  return def ? `${def.bg} ${def.text}` : 'bg-muted text-muted-foreground';
};

const effClasses = (v) => EFFECTIVENESS_STYLES[v] || 'bg-muted text-muted-foreground';

function makeCellFor(categoryOptions) {
  return (c, key) => {
    switch (key) {
      case 'control': {
        const lines = [[text(c.control || '—', { bold: true })]];
        const desc = stripHtml(c.description);
        if (desc) lines.push([text(desc, { muted: true, size: 6.8 })]);
        if (c.risk_title) lines.push([caption('Risk:'), text(c.risk_title, { muted: true, size: 6.5 })]);
        const sub = [];
        if (c.category) sub.push(caption('Risk Category:'), badge(c.category, categoryClasses(c.category, categoryOptions)));
        if (c.owner) sub.push(caption('Risk Owner:'), person(c.owner));
        if (sub.length) lines.push(sub);
        return lines;
      }
      case 'design_effectiveness':
        return c.design_effectiveness ? [[badge(c.design_effectiveness, effClasses(c.design_effectiveness))]] : [[DASH]];
      case 'operating_effectiveness':
        return c.operating_effectiveness ? [[badge(c.operating_effectiveness, effClasses(c.operating_effectiveness))]] : [[DASH]];
      default:
        return [];
    }
  };
}

function summaryFor(controls) {
  const count = (v) => controls.filter((c) => c.design_effectiveness === v || c.operating_effectiveness === v).length;
  return [
    { value: controls.length, label: 'Total Controls' },
    { value: count('Effective'), label: 'Effective Controls' },
    { value: count('Partially Effective'), label: 'Partially Effective Controls' },
    { value: count('Ineffective'), label: 'Ineffective Controls' },
  ];
}

const buildOpts = (controls, title, statusLabel, categoryOptions) => ({
  title,
  statusLabel,
  summary: summaryFor(controls),
  columns: COLUMNS,
  rows: controls,
  cellFor: makeCellFor(categoryOptions),
});

const EXCEL_COLUMNS = [
  { label: 'Risk Control', value: (c) => c.control || '' },
  { label: 'Control Description', value: (c) => stripHtml(c.description) },
  { label: 'Related Risk', value: (c) => c.risk_title || '' },
  { label: 'Risk Category', value: (c) => c.category || '' },
  { label: 'Risk Owner', value: (c) => c.owner || '' },
  { label: 'Design Effectiveness', value: (c) => c.design_effectiveness || '' },
  { label: 'Operating Effectiveness', value: (c) => c.operating_effectiveness || '' },
];

export function exportToExcel(controls, title = 'Controls Register') {
  exportRegisterExcel({ title, sheetName: 'Controls', columns: EXCEL_COLUMNS, rows: controls });
}

export function exportToPdf(controls, title = 'Controls Register', statusLabel = 'All Controls', categoryOptions = []) {
  exportRegisterPdf(buildOpts(controls, title, statusLabel, categoryOptions));
}