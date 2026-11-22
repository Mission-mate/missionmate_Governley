import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { format } from 'date-fns';
import { CONTACT_TYPE_FIELD_ID } from '@/lib/contactTypeConfig';
import { getTagPdfRgb } from '@/lib/tagColors';
import { resolveTags, tagNames } from '@/lib/tags';

// ── Value resolution (mirrors ContactsTable rendering) ────────────────────────

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

// Contact Type custom-field → array of display labels.
function typeLabels(contact, ctConfig) {
  const raw = contact.custom_fields?.[CONTACT_TYPE_FIELD_ID];
  const values = Array.isArray(raw) ? raw : (raw ? [raw] : []);
  return values.map((v) => ctConfig.options.find((o) => o.value === v)?.label || v);
}

/**
 * Builds the column model that matches the UI table exactly.
 * Fixed columns + only the custom fields the user has chosen to show.
 */
function buildColumns(visibleCustomFields) {
  return [
    { id: 'name', label: 'Name' },
    { id: 'contact_details', label: 'Contact Details' },
    { id: 'type', label: 'Type', kind: 'type' },
    { id: 'tags', label: 'Tags', kind: 'tags' },
    ...visibleCustomFields.map((f) => ({ id: f.id, label: f.name, kind: 'custom', field: f })),
  ];
}

// Plain-text cell value for a contact + column (used by Excel + PDF wrapping).
function cellText(contact, col, ctConfig, tagMap = {}) {
  switch (col.id) {
    case 'name': {
      const name = `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
      return contact.company ? `${name}\n${contact.company}` : name;
    }
    case 'contact_details':
      return [contact.email, contact.phone].filter(Boolean).join('\n');
    case 'type':
      return typeLabels(contact, ctConfig).join(', ');
    case 'tags':
      return tagNames(contact.tags, tagMap).join(', ');
    default:
      return customFieldText(col.field, contact.custom_fields?.[col.id]);
  }
}

// ── Excel export ───────────────────────────────────────────────────────────────

export function exportContactsToExcel(contacts, visibleCustomFields, ctConfig, tagMap = {}) {
  const rows = contacts.map((c) => {
    const row = {};
    // Split Name → First/Last, Contact Details → Email/Phone for spreadsheet usability
    row['First Name'] = c.first_name || '';
    row['Last Name'] = c.last_name || '';
    row['Company'] = c.company || '';
    row['Email'] = c.email || '';
    row['Phone'] = c.phone || '';
    row['Type'] = typeLabels(c, ctConfig).join(', ');
    row['Tags'] = tagNames(c.tags, tagMap).join(', ');
    visibleCustomFields.forEach((f) => {
      row[f.name] = customFieldText(f, c.custom_fields?.[f.id]);
    });
    return row;
  });

  return writeStyledWorkbook({
    fileName: `contacts-export-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
    sheetName: 'Contacts',
    headers: Object.keys(rows[0] || { 'First Name': '' }),
    rows,
  });
}

// ── PDF export (landscape, colored badges to match UI) ────────────────────────

const TYPE_RGB = { bg: [219, 234, 254], text: [29, 78, 216] }; // blue, matches UI Type badge

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

// Rows rendered per batch before yielding to the event loop, so the main thread
// can paint the "Exporting…" state and stay responsive during large exports.
const PDF_CHUNK_SIZE = 25;

const yieldToEventLoop = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function exportContactsToPdf(contacts, visibleCustomFields, ctConfig, tagMap = {}, meta = {}) {
  const columns = buildColumns(visibleCustomFields);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 32;
  const usableW = pageW - margin * 2;

  // Title + metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Contact Database', margin, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120);
  const metaParts = [
    `Exported ${fmtDate(new Date())}`,
    `${contacts.length} contact${contacts.length !== 1 ? 's' : ''}`,
  ];
  if (meta.scope) metaParts.push(meta.scope);
  if (meta.search) metaParts.push(`Search: "${meta.search}"`);
  if (meta.filters) metaParts.push(meta.filters);
  doc.text(metaParts.join(' · '), margin, 56);
  doc.setTextColor(0);

  // Column widths mirror the on-screen ContactsTable proportions (Contact Details
  // combines Email + Contact Number). Custom columns get a 10% share each, then
  // everything is normalised to fit the page width.
  const FIXED_SHARES = {
    name: 0.22,
    contact_details: 0.40,
    type: 0.20,
    tags: 0.18,
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

  for (let index = 0; index < contacts.length; index += 1) {
    const contact = contacts[index];
    // Pre-compute wrapped text / badge counts to size the row
    const cellInfos = columns.map((col, i) => {
      if (col.kind === 'tags') {
        const badges = resolveTags(contact.tags, tagMap).map((t) => ({
          label: t.name,
          rgb: getTagPdfRgb(t.color),
        }));
        return { kind: 'tags', badges, lines: Math.max(1, badges.length) };
      }
      if (col.kind === 'type') {
        const badges = typeLabels(contact, ctConfig).map((l) => ({ label: l, rgb: TYPE_RGB }));
        return { kind: 'type', badges, lines: Math.max(1, badges.length) };
      }
      const text = cellText(contact, col, ctConfig, tagMap);
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
      if (info.kind === 'tags' || info.kind === 'type') {
        drawBadgeCell(doc, info.badges, x, textY, colW[i], cellPad, lineH);
      } else {
        doc.text(info.wrapped, x + cellPad, textY, { maxWidth: colW[i] - cellPad * 2 });
      }
      x += colW[i];
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y + rowH - cellPad, margin + usableW, y + rowH - cellPad);
    y += rowH;

    if ((index + 1) % PDF_CHUNK_SIZE === 0) await yieldToEventLoop();
  }

  doc.save(`contacts-export-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
}