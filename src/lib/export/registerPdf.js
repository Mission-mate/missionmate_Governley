import { jsPDF } from 'jspdf';
import { badgeColors, RGB } from './exportColors';
import { initials } from './registerCells';

const MARGIN = 28;
const PAD = 5;

/** Height of one visual text line for a given font size. */
const lineHeight = (size) => (size <= 7 ? 9 : 11);

function setColor(doc, rgb) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

/**
 * Renders a register table to PDF, reproducing the on-screen columns, badge
 * colours, owner initials and progress bars.
 *
 * @param {object} opts
 *  title        - document + heading title
 *  statusLabel  - report status metadata, e.g. "All Risks"
 *  summary      - [{ label, value }] summary card data
 *  columns      - [{ key, label, width }] mirroring the table columns
 *  rows         - data rows
 *  cellFor(row, key) - returns a cell descriptor (array of lines of chips)
 */
export function exportRegisterPdf({ title, statusLabel, summary = [], columns, rows, cellFor, extraPage }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const usableW = pageW - MARGIN * 2;

  const totalWidth = columns.reduce((s, c) => s + (c.width || 100), 0);
  const colWidths = columns.map((c) => ((c.width || 100) / totalWidth) * usableW);

  // ---------- Header ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setColor(doc, RGB.foreground);
  doc.text(title, MARGIN, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(doc, RGB.muted);
  const exported = new Date().toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' });
  doc.text(`Exported ${exported}   ·   Report Status: ${statusLabel}   ·   ${rows.length} record${rows.length !== 1 ? 's' : ''}`, MARGIN, 58);

  let y = 74;
  if (summary.length) {
    let x = MARGIN;
    summary.forEach((s) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      setColor(doc, RGB.foreground);
      const val = String(s.value);
      doc.text(val, x, y);
      const valW = doc.getTextWidth(val);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor(doc, RGB.muted);
      doc.text(` ${s.label}`, x + valW, y);
      x += valW + doc.getTextWidth(` ${s.label}`) + 18;
    });
    y += 18;
  }

  // ---------- Table ----------
  const drawHeader = () => {
    doc.setFillColor(243, 244, 246);
    doc.rect(MARGIN, y, usableW, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    setColor(doc, [80, 85, 95]);
    let x = MARGIN;
    columns.forEach((c, i) => {
      doc.text(String(c.label).toUpperCase(), x + PAD, y + 12, { maxWidth: colWidths[i] - PAD * 2 });
      x += colWidths[i];
    });
    y += 18;
  };

  drawHeader();

  // Pre-wrap a cell into visual lines: [{ chips, size, wrapped? }]
  const layoutCell = (cell, width) => {
    const out = [];
    (cell || []).forEach((ln) => {
      const only = ln.length === 1 ? ln[0] : null;
      if (only && only.kind === 'text') {
        const size = only.size || 7.5;
        doc.setFontSize(size);
        doc.setFont('helvetica', only.bold ? 'bold' : 'normal');
        const parts = doc.splitTextToSize(only.text || '', width - PAD * 2);
        (parts.length ? parts : ['']).forEach((p) => out.push({ chips: [{ ...only, text: p }], size }));
      } else {
        const size = Math.min(...ln.map((c) => c.size || 7.5));
        out.push({ chips: ln, size });
      }
    });
    return out;
  };

  const drawChips = (chips, x, baselineY, width) => {
    let cx = x + PAD;
    const limit = x + width - PAD;
    chips.forEach((chip) => {
      if (cx >= limit) return;
      if (chip.kind === 'badge') {
        const { bg, fg } = badgeColors(chip.classes);
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'bold');
        const w = Math.min(doc.getTextWidth(chip.text) + 9, limit - cx);
        doc.setFillColor(bg[0], bg[1], bg[2]);
        doc.roundedRect(cx, baselineY - 7, w, 10.5, 4, 4, 'F');
        setColor(doc, fg);
        doc.text(chip.text, cx + 4.5, baselineY, { maxWidth: w - 8 });
        cx += w + 5;
      } else if (chip.kind === 'person') {
        doc.setFillColor(219, 234, 254);
        doc.circle(cx + 5, baselineY - 2.5, 5.2, 'F');
        doc.setFontSize(5.4);
        doc.setFont('helvetica', 'bold');
        setColor(doc, [29, 78, 216]);
        const ini = initials(chip.text);
        doc.text(ini, cx + 5 - doc.getTextWidth(ini) / 2, baselineY - 0.6);
        doc.setFontSize(7.2);
        doc.setFont('helvetica', 'normal');
        setColor(doc, RGB.foreground);
        doc.text(chip.text, cx + 13, baselineY, { maxWidth: limit - cx - 13 });
        cx = limit;
      } else if (chip.kind === 'progress') {
        const barW = Math.min(44, limit - cx - 24);
        doc.setFillColor(229, 231, 235);
        doc.roundedRect(cx, baselineY - 5.5, barW, 5, 2.5, 2.5, 'F');
        const done = chip.value >= 100;
        const fill = done ? [16, 185, 129] : [59, 130, 246];
        if (chip.value > 0) {
          doc.setFillColor(fill[0], fill[1], fill[2]);
          doc.roundedRect(cx, baselineY - 5.5, Math.max(2, (barW * Math.min(chip.value, 100)) / 100), 5, 2.5, 2.5, 'F');
        }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        setColor(doc, RGB.foreground);
        doc.text(`${chip.value}%`, cx + barW + 4, baselineY);
        cx = limit;
      } else {
        const size = chip.size || 7.5;
        doc.setFontSize(size);
        doc.setFont('helvetica', chip.bold ? 'bold' : 'normal');
        setColor(doc, chip.muted ? RGB.muted : chip.danger ? RGB.destructive : RGB.foreground);
        doc.text(chip.text, cx, baselineY, { maxWidth: limit - cx });
        cx += doc.getTextWidth(chip.text) + 4;
      }
    });
  };

  rows.forEach((row) => {
    const laidOut = columns.map((c, i) => layoutCell(cellFor(row, c.key), colWidths[i]));
    const heights = laidOut.map((lines) => lines.reduce((s, l) => s + lineHeight(l.size), 0));
    const rowH = Math.max(20, Math.max(...heights, 0) + PAD * 2);

    if (y + rowH > pageH - MARGIN) {
      doc.addPage();
      y = MARGIN;
      drawHeader();
    }

    let x = MARGIN;
    laidOut.forEach((lines, i) => {
      let ly = y + PAD + 7;
      lines.forEach((l) => {
        drawChips(l.chips, x, ly, colWidths[i]);
        ly += lineHeight(l.size);
      });
      x += colWidths[i];
    });

    doc.setDrawColor(229, 231, 235);
    doc.line(MARGIN, y + rowH, MARGIN + usableW, y + rowH);
    y += rowH;
  });

  if (extraPage?.groups?.length) {
    doc.addPage();
    y = 42;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    setColor(doc, RGB.foreground);
    doc.text(extraPage.heading, MARGIN, y);
    y += 22;

    const ensureSpace = (needed) => {
      if (y + needed > pageH - MARGIN) {
        doc.addPage();
        y = MARGIN + 10;
      }
    };

    extraPage.groups.forEach((group) => {
      ensureSpace(40);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setColor(doc, RGB.foreground);
      doc.text(group.title, MARGIN, y);
      y += 6;
      doc.setDrawColor(229, 231, 235);
      doc.line(MARGIN, y, MARGIN + usableW, y);
      y += 14;

      group.notes.forEach((note) => {
        ensureSpace(34);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        setColor(doc, RGB.foreground);
        doc.text(note.title || 'Note', MARGIN + 10, y);
        y += 10;
        if (note.meta) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          setColor(doc, RGB.muted);
          doc.text(note.meta, MARGIN + 10, y);
          y += 11;
        }
        if (note.body) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          setColor(doc, [55, 65, 81]);
          doc.splitTextToSize(note.body, usableW - 20).forEach((ln) => {
            ensureSpace(12);
            doc.text(ln, MARGIN + 10, y);
            y += 11;
          });
        }
        y += 8;
      });
      y += 10;
    });
  }

  doc.save(`${title.replace(/[^\w-]+/g, '_')}.pdf`);
}