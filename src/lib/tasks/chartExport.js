import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { localToday } from '@/lib/localClock';

/**
 * Capture helpers for the master analytics dashboard.
 * html2canvas cannot parse oklch() colours, so tiles carry plain hex fallbacks
 * (data-plain-bg / data-plain-color) that are swapped in on the cloned DOM.
 */
const onclone = (doc) => {
  doc.querySelectorAll('[data-plain-bg]').forEach((el) => {
    el.style.background = el.getAttribute('data-plain-bg');
  });
  doc.querySelectorAll('[data-plain-color]').forEach((el) => {
    el.style.background = 'none';
    el.style.webkitTextFillColor = el.getAttribute('data-plain-color');
    el.style.color = el.getAttribute('data-plain-color');
  });
};

const capture = async (node) =>
  html2canvas(node, { scale: 2, backgroundColor: '#ffffff', useCORS: true, onclone });

const fileStamp = () => localToday();

/** Whole dashboard (metric tiles + charts) into a single landscape PDF page. */
export async function exportDashboardToPdf(node, title) {
  const canvas = await capture(node);
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 28;

  pdf.setFontSize(14);
  pdf.text(title, margin, margin + 4);

  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2 - 24;
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin + 16, canvas.width * ratio, canvas.height * ratio);
  pdf.save(`${title.replace(/[^\w\s-]/g, '')} - Charts ${fileStamp()}.pdf`);
}

/** One slide per chart, each with its title and rendered image. */
export async function exportChartsToPpt(charts, title) {
  const { default: PptxGenJS } = await import('pptxgenjs');
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';

  for (const chart of charts) {
    if (!chart.node) continue;
    const canvas = await capture(chart.node);
    const slide = pptx.addSlide();
    slide.addText(chart.title, { x: 0.5, y: 0.35, fontSize: 20, bold: true, color: '1f2937' });

    const maxW = 9;
    const maxH = 4.4;
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height);
    const w = canvas.width * ratio;
    const h = canvas.height * ratio;
    slide.addImage({ data: canvas.toDataURL('image/png'), x: (10 - w) / 2, y: 1.1, w, h });
  }

  await pptx.writeFile({ fileName: `${title.replace(/[^\w\s-]/g, '')} - Charts ${fileStamp()}.pptx` });
}