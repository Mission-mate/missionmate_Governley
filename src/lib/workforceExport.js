import { jsPDF } from 'jspdf';
import { writeStyledWorkbook } from '@/lib/export/excelWorkbook';
import { formatReviewDate } from '@/lib/complianceRegisters';
import { daysToExpiry, maskRef, statusOf } from '@/lib/workforceRegister';
import { localToday } from '@/lib/localClock';

const fileBase = (t) => (t || 'workforce-credentials').replace(/[^\w-]+/g, '_');
const fmt = (v) => (v ? formatReviewDate(v) : '');
const expiryText = (r) => (!r ? '' : daysToExpiry(r) === null ? 'No expiry' : fmt(r.expiry_date));
const expired = (r) => { const d = daysToExpiry(r); return d !== null && d < 0; };
const ref = (r) => (r.restricted ? 'Restricted' : maskRef(r.reference_number));

// Badge colours mirroring the UI pills: [background, text].
const BADGE = {
  Current: [[220, 252, 231], [21, 128, 61]], Expired: [[254, 226, 226], [185, 28, 28]],
  Active: [[220, 252, 231], [21, 128, 61]], Archived: [[243, 244, 246], [75, 85, 99]],
  Verified: [[220, 252, 231], [21, 128, 61]], Pending: [[255, 237, 213], [194, 65, 12]], Exempted: [[219, 234, 254], [29, 78, 216]],
};
const DOT = { 'On Track': [21, 128, 61], 'At Risk': [180, 83, 9] };
const RED = [185, 28, 28]; const MUTED = [107, 114, 128]; const INK = [17, 24, 39];
const hex = ([r, g, b]) => `FF${[r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
const BADGE_COLS = ['Validity', 'Verification', 'Status', 'Person Status'];

function excel(rows, title, cols, expiryOf = (r) => r) {
  return writeStyledWorkbook({
    fileName: `${fileBase(title)}.xlsx`, sheetName: 'Register', headers: cols.map(([h]) => h),
    rows: rows.map((r) => ({ ...Object.fromEntries(cols.map(([h, f]) => [h, f(r) || ''])), _r: r })),
    cellStyle: (row, h) => {
      if (BADGE_COLS.includes(h)) { const c = BADGE[row[h]]; return c && { color: hex(c[1]) }; }
      if (h === 'Compliance') return DOT[row[h]] && { color: hex(DOT[row[h]]) };
      if ((h === 'Expiry Date' || h === 'Next Expiry') && expired(expiryOf(row._r))) return { color: hex(RED) };
      return undefined;
    },
  });
}

const CRED_COLS = [
  ['Credential', (r) => r.credential_name], ['Reference', ref], ['Jurisdiction', (r) => r.jurisdiction],
  ['Person', (r) => r.person.full_name], ['Person Type', (r) => r.person.person_type], ['Validity', (r) => r.validity],
  ['Expiry Date', expiryText], ['Verification', (r) => r.verification_status], ['Verified Date', (r) => fmt(r.verified_date)],
  ['Status', (r) => statusOf(r)],
];
const PROFILE_COLS = [
  ['Credential', (r) => r.credential_name], ['Reference', ref], ['Validity', (r) => r.validity], ['Jurisdiction', (r) => r.jurisdiction],
  ['Issue Date', (r) => fmt(r.issue_date)], ['Expiry Date', expiryText], ['Verification', (r) => r.verification_status],
  ['Verified By', (r) => r.verified_by], ['Verified Date', (r) => fmt(r.verified_date)], ['Status', (r) => statusOf(r)],
];
export const exportCredentialsExcel = (rows, title) => excel(rows, title, CRED_COLS);
export const exportProfileCredentialsExcel = (rows, title) => excel(rows, title, PROFILE_COLS);
export function exportPeopleExcel(people, stats, title) {
  const cols = [
    ['Person', (p) => p.full_name], ['Email', (p) => p.email], ['Person Type', (p) => p.person_type], ['Role', (p) => p.role],
    ['Program or Area', (p) => p.program_area], ['Credentials Held', (p) => String(stats[p.id].count)],
    ['Next Expiry', (p) => expiryText(stats[p.id].nextExpiry)], ['Compliance', (p) => stats[p.id].compliance], ['Status', (p) => statusOf(p)],
  ];
  return excel(people, title, cols, (p) => stats[p.id].nextExpiry);
}

/** Small PDF table renderer with badge / dot / coloured-text cell kinds. */
function pdfDoc(title) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth(); const H = doc.internal.pageSize.getHeight(); const m = 32;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15); doc.setTextColor(...INK); doc.text(title, m, 40);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...MUTED);
  doc.text(`Exported ${formatReviewDate(localToday())}`, m, 56);
  const s = { doc, W, H, m, y: 80 };
  const ensure = (h) => { if (s.y + h > H - m) { doc.addPage(); s.y = m + 10; } };
  const text = (t, x, y, { bold, color = INK, size = 8.5 } = {}) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size); doc.setTextColor(...color); doc.text(String(t), x, y);
  };
  const cell = (c, x, y) => {
    if (!c) { text('—', x, y, { color: MUTED }); return; }
    if (typeof c === 'string') { text(c, x, y); return; }
    if (c.badge) {
      const col = BADGE[c.badge]; if (!col) { text(c.badge, x, y); return; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); const w = doc.getTextWidth(c.badge) + 10;
      doc.setFillColor(...col[0]); doc.roundedRect(x, y - 8.5, w, 12, 3, 3, 'F'); text(c.badge, x + 5, y, { bold: true, color: col[1], size: 7.5 });
    } else if (c.dot) {
      const col = DOT[c.dot] || MUTED; doc.setFillColor(...col); doc.circle(x + 3, y - 3, 2.5, 'F'); text(c.dot, x + 10, y, { bold: true, color: col });
    } else text(c.text || '—', x, y, { bold: c.bold, color: c.color || INK });
    if (c.sub) text(c.sub, x, y + 11, { size: 7.5, color: c.subColor || MUTED });
  };
  const header = (heads, xs) => {
    ensure(20); doc.setFillColor(243, 244, 246); doc.rect(m, s.y - 11, W - m * 2, 18, 'F');
    heads.forEach((h, i) => text(h.toUpperCase(), xs[i] + 4, s.y, { bold: true, color: MUTED, size: 7.5 })); s.y += 20;
  };
  const band = (label, sub, fill) => {
    ensure(22); doc.setFillColor(...fill); doc.rect(m, s.y - 12, W - m * 2, 20, 'F');
    text(label, m + 6, s.y + 1, { bold: true, size: 9 });
    if (sub) { doc.setFontSize(9); doc.setFont('helvetica', 'bold'); text(sub, m + 12 + doc.getTextWidth(label), s.y + 1, { color: MUTED, size: 8 }); }
    s.y += 22;
  };
  const row = (cells, xs) => {
    ensure(28); cells.forEach((c, i) => cell(c, xs[i] + 4, s.y + 2));
    doc.setDrawColor(229, 231, 235); doc.line(m, s.y + 16, W - m, s.y + 16); s.y += 28;
  };
  return { ...s, header, band, row, save: (t) => doc.save(`${fileBase(t)}.pdf`) };
}

const expiryCell = (r) => {
  if (!r) return '';
  const d = daysToExpiry(r);
  return { text: expiryText(r), color: expired(r) ? RED : INK, sub: d !== null && d < 0 ? `${-d} days ago` : '', subColor: RED };
};

/** Workforce tab PDF — one row per person. */
export function exportPeoplePdf(people, stats, title) {
  const p = pdfDoc(title || 'Workforce Licences and Credentials Register'); const m = p.m;
  const xs = [m, m + 200, m + 300, m + 430, m + 560, m + 680];
  p.header(['Person', 'Person Type', 'Role', 'Next Expiry', 'Compliance', 'Status'], xs);
  people.forEach((x) => {
    const s = stats[x.id];
    p.row([{ text: x.full_name, bold: true, sub: x.email || '' }, x.person_type || '', x.role || '', expiryCell(s.nextExpiry),
      s.compliance ? { dot: s.compliance } : '', { badge: statusOf(x) }], xs);
  });
  p.save(title);
}

/** Credentials tab PDF mirroring the table; `groups` (or null when ungrouped) adds section bands. */
export function exportCredentialsPdf(groups, rows, title) {
  const p = pdfDoc(title || 'Workforce Licences and Credentials Register'); const m = p.m;
  const xs = [m, m + 230, m + 430, m + 530, m + 660];
  p.header(['Credential', 'Person', 'Validity', 'Expiry Date', 'Verification'], xs);
  const rowOf = (r) => p.row([{ text: r.credential_name, bold: true, sub: [ref(r), r.jurisdiction].filter(Boolean).join(' · ') },
    { text: r.person.full_name, bold: true, sub: r.person.person_type || '' },
    { badge: r.validity }, expiryCell(r), { badge: r.verification_status }], xs);
  if (!groups) rows.forEach(rowOf);
  else groups.forEach((g) => { p.band(g.label, `${g.rows.length} credential${g.rows.length === 1 ? '' : 's'}`, [243, 244, 246]); g.rows.forEach(rowOf); });
  p.save(title);
}

/** Profile Credentials Register PDF mirroring its table columns. */
export function exportProfileCredentialsPdf(rows, title) {
  const p = pdfDoc(title); const m = p.m;
  const xs = [m, m + 220, m + 320, m + 420, m + 540, m + 650];
  p.header(['Credential', 'Validity', 'Issue Date', 'Expiry Date', 'Verification', 'Verified By'], xs);
  rows.forEach((r) => {
    p.row([{ text: r.credential_name, bold: true, sub: [ref(r), r.jurisdiction].filter(Boolean).join(' · ') }, { badge: r.validity }, fmt(r.issue_date),
      expiryCell(r), { badge: r.verification_status }, r.verified_by || '—'], xs);
  });
  p.save(title);
}