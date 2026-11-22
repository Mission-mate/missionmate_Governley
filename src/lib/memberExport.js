import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { format } from 'date-fns';
import { MEMBER_SYSTEM_FIELDS } from '@/lib/memberSystemFields';
import { getTagPdfRgb } from '@/lib/tagColors';
import { resolveTags, tagNames } from '@/lib/tags';
import { resolveStructureName, resolveTierName } from '@/lib/memberPlanNames';

// ── Value resolution (mirrors MembersTable rendering) ─────────────────────────

function fmtDate(value) {
  try { return format(new Date(value), 'd MMM yyyy'); } catch { return String(value); }
}

// Resolve a custom field's stored value to a plain display string.
function customFieldText(field, value) {
  if (value == null || value === '' || (Array.isArray(value) && value.length === 0)) return '';
  const options = field.options || [];
  const labelFor = (v) => options.find((o) => o.value === v)?.label || v;
  if (field.type === 'Date Picker') return fmtDate(value);
  if (Array.isArray(value)) return value.map(labelFor).join(', ');
  return options.length ? labelFor(value) : String(value);
}

// ── Excel export (all configured columns, including UI-hidden custom fields) ──

const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export function exportMembersToExcel(members, customFields = [], tagMap = {}, structures = []) {
  const rows = members.map((m) => {
    const row = {};

    // Contact Details — every system field (matches the Contact Details card)
    MEMBER_SYSTEM_FIELDS.forEach((f) => {
      const value = m[f.key];
      row[f.label] = f.inputType === 'date' && value ? fmtDate(value) : (value || '');
    });
    row['Tags'] = tagNames(m.tags, tagMap).join(', ');

    // Membership Details — every field on the Membership Details card
    // Live-resolved so the export always matches the on-screen table.
    row['Membership Plan'] = resolveStructureName(m, structures);
    row['Tier'] = resolveTierName(m, structures);
    row['Status'] = cap(m.status);
    row['Start Date'] = m.start_date ? fmtDate(m.start_date) : '';
    row['Expiration Date'] = m.expiration_date ? fmtDate(m.expiration_date) : 'Never';
    row['Payment Method'] = m.payment_method || '';
    row['Online Payment Type'] = m.online_payment_type === 'recurrent' ? 'Recurrent' : (m.online_payment_type === 'one_time' ? 'One-time' : '');
    row['Payment Status'] = m.payment_status || '';
    row['Notes'] = m.notes || '';

    // Additional Details — dynamic custom fields (auto-includes any newly added)
    customFields.forEach((f) => {
      row[f.name] = customFieldText(f, m.custom_fields?.[f.id]);
    });
    return row;
  });

  return writeStyledWorkbook({
    fileName: `members-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Members',
    headers: Object.keys(rows[0] || { 'First Name': '' }),
    rows,
  });
}

// ── PDF export (landscape, colored badges to match UI) ────────────────────────

// Status badge colours mirror MembersTable STATUS_STYLES.
const STATUS_RGB = {
  active:  { bg: [220, 252, 231], text: [21, 128, 61] },
  pending: { bg: [254, 243, 199], text: [180, 83, 9] },
  expired: { bg: [254, 226, 226], text: [185, 28, 28] },
};
const STATUS_DEFAULT = { bg: [243, 244, 246], text: [107, 114, 128] };

// Payment status badge colours mirror MembersTable PAYMENT_STATUS_STYLES.
const PAYMENT_STATUS_RGB = {
  Paid:    { bg: [220, 252, 231], text: [21, 128, 61] },
  Pending: { bg: [254, 243, 199], text: [180, 83, 9] },
  Overdue: { bg: [254, 226, 226], text: [185, 28, 28] },
};
const TITLE_BLUE = [29, 78, 216];
const META_GREY = [107, 114, 128];

function drawBadge(doc, label, rgb, x, y) {
  const padX = 5;
  const w = doc.getTextWidth(label) + padX * 2;
  const h = 13;
  doc.setFillColor(...rgb.bg);
  doc.roundedRect(x, y - 9, w, h, 3, 3, 'F');
  doc.setTextColor(...rgb.text);
  doc.text(label, x + padX, y);
  doc.setTextColor(0);
  return w;
}

// Draw a wrapping row of badges within a column; returns number of lines used.
function drawBadgeCell(doc, badges, x, yTop, colW, cellPad, lineH) {
  let cx = x + cellPad;
  let cy = yTop;
  let lines = 1;
  const maxX = x + colW - cellPad;
  badges.forEach(({ label, rgb }) => {
    const padX = 5;
    const bw = doc.getTextWidth(label) + padX * 2;
    if (cx + bw > maxX && cx > x + cellPad) {
      cx = x + cellPad;
      cy += lineH + 5;
      lines += 1;
    }
    drawBadge(doc, label, rgb, cx, cy);
    cx += bw + 4;
  });
  return lines;
}

// PDF columns strictly match the current Members table (plus visible custom fields).
const PDF_COLUMNS = [
  { id: 'name', label: 'Name', kind: 'name' },
  { id: 'structure', label: 'Membership Plan', kind: 'text' },
  { id: 'start_date', label: 'Start Date', kind: 'text' },
  { id: 'expiration_date', label: 'Expiration Date', kind: 'text' },
  { id: 'status', label: 'Status', kind: 'status' },
  { id: 'payment_status', label: 'Payment Status', kind: 'payment' },
  { id: 'tags', label: 'Tags', kind: 'tags' },
];

export function exportMembersToPdf(members, tagMap = {}, meta = {}, customFields = [], structures = []) {
  const visibleCustom = (customFields || []).filter((f) => f.isVisibleInDatabase);
  const columns = [
    ...PDF_COLUMNS,
    ...visibleCustom.map((f) => ({ id: `custom:${f.id}`, label: f.name, kind: 'custom', field: f })),
  ];
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;

  // Title + metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Members', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  const metaParts = [
    `Exported ${fmtDate(new Date())}`,
    `${members.length} member${members.length !== 1 ? 's' : ''}`,
  ];
  if (meta.scope) metaParts.push(meta.scope);
  if (meta.search) metaParts.push(`Search: "${meta.search}"`);
  if (meta.filters) metaParts.push(meta.filters);
  doc.text(metaParts.join(' · '), margin, 56);
  doc.setTextColor(0);

  // Column widths mirror the on-screen MembersTable proportions. Custom columns
  // get a 10% share each, then everything is normalised to fit the page width.
  const FIXED_SHARES = {
    name: 0.19,
    structure: 0.16,
    start_date: 0.12,
    expiration_date: 0.12,
    status: 0.14,
    payment_status: 0.12,
    tags: 0.15,
  };
  const shares = columns.map((c) => FIXED_SHARES[c.id] ?? 0.10);
  const shareTotal = shares.reduce((s, v) => s + v, 0);
  const colW = shares.map((s) => (usableW * s) / shareTotal);

  let y = 78;
  const lineH = 11;
  const cellPad = 5;

  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(margin, y - 12, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(80);
    let x = margin;
    columns.forEach((c, i) => {
      doc.text(String(c.label).toUpperCase(), x + cellPad, y, { maxWidth: colW[i] - cellPad * 2 });
      x += colW[i];
    });
    doc.setTextColor(0);
    y += 14;
  };

  drawHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  members.forEach((m) => {
    const textFor = (col) => {
      switch (col.id) {
        case 'structure': return resolveStructureName(m, structures);
        case 'start_date': return m.start_date ? fmtDate(m.start_date) : '';
        case 'expiration_date': return m.expiration_date ? fmtDate(m.expiration_date) : 'Never';
        default: return '';
      }
    };

    // Pre-compute wrapped text / badge counts to size the row.
    const cellInfos = columns.map((col, i) => {
      if (col.kind === 'name') {
        const name = `${m.first_name || ''} ${m.last_name || ''}`.trim();
        return { kind: 'name', name, lines: 1 };
      }
      if (col.kind === 'status') {
        const label = m.status ? m.status.charAt(0).toUpperCase() + m.status.slice(1) : '–';
        const rgb = STATUS_RGB[m.status] || STATUS_DEFAULT;
        return { kind: 'status', badges: [{ label, rgb }], lines: 1 };
      }
      if (col.kind === 'payment') {
        if (!m.payment_status) {
          const wrapped = doc.splitTextToSize('–', colW[i] - cellPad * 2);
          return { kind: 'text', wrapped, lines: 1 };
        }
        const rgb = PAYMENT_STATUS_RGB[m.payment_status] || STATUS_DEFAULT;
        return { kind: 'status', badges: [{ label: m.payment_status, rgb }], lines: 1 };
      }
      if (col.kind === 'custom') {
        const text = customFieldText(col.field, m.custom_fields?.[col.field.id]);
        const wrapped = doc.splitTextToSize(String(text || ''), colW[i] - cellPad * 2);
        return { kind: 'text', wrapped, lines: Math.max(1, wrapped.length) };
      }
      if (col.kind === 'tags') {
        const badges = resolveTags(m.tags, tagMap).map((t) => ({
          label: t.name,
          rgb: getTagPdfRgb(t.color),
        }));
        return { kind: 'tags', badges, lines: Math.max(1, badges.length) };
      }
      const text = textFor(col);
      const wrapped = doc.splitTextToSize(String(text || ''), colW[i] - cellPad * 2);
      return { kind: 'text', wrapped, lines: Math.max(1, wrapped.length) };
    });

    const rowLines = Math.max(1, ...cellInfos.map((c) => c.lines));
    const rowH = rowLines * (lineH + 3) + cellPad;

    if (y + rowH > pageH - margin) {
      doc.addPage();
      y = margin + 20;
      drawHeader();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
    }

    let x = margin;
    const textY = y + cellPad + 4;
    cellInfos.forEach((info, i) => {
      if (info.kind === 'name') {
        // Blue title — matches UI.
        doc.setTextColor(...TITLE_BLUE);
        doc.text(info.name, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
        doc.setTextColor(0);
      } else if (info.kind === 'contact') {
        // Grey email / phone, stacked — matches UI Contact Details column.
        doc.setTextColor(...META_GREY);
        info.metaLines.forEach((line, li) => {
          doc.text(line, x + cellPad, textY + li * (lineH + 1), { maxWidth: colW[i] - cellPad * 2 });
        });
        doc.setTextColor(0);
      } else if (info.kind === 'status' || info.kind === 'tags') {
        drawBadgeCell(doc, info.badges, x, textY, colW[i], cellPad, lineH);
      } else {
        doc.text(info.wrapped, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
      }
      x += colW[i];
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;
  });

  doc.save(`members-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}