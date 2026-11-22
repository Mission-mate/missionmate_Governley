import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { jsPDF } from 'npm:jspdf@4.2.1';
import { getOrgTimezone } from '../_shared/orgClock.ts';

// Formats a date-time as "2 Jul 2026" in the organisation's timezone.
function formatDate(iso, timeZone) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone,
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

// Turns a stored answer value (string / number / array / object) into readable text.
function formatValue(value) {
  if (value == null || value === '') return '—';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') {
    if (value.file_name) return String(value.file_name);
    if (value.url) return String(value.url);
    return JSON.stringify(value);
  }
  return String(value);
}

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { submission_id } = await req.json().catch(() => ({}));
    if (!submission_id) return Response.json({ error: 'submission_id is required' }, { status: 400 });

    const submission = await base44.asServiceRole.entities.MembershipApplicationResponse.get(submission_id).catch(() => null);
    if (!submission) return Response.json({ error: 'Submission not found' }, { status: 404 });

    // Branding: org name from org_profile, falling back to the membership form config.
    const orgRecords = await base44.asServiceRole.entities.AppConfig.filter({ key: 'org_profile' });
    const org = orgRecords[0]?.settings || {};
    const formConfigs = await base44.asServiceRole.entities.MembershipFormConfig.filter({ slug: 'default' });
    const formConfig = formConfigs[0] || {};

    const timeZone = await getOrgTimezone(base44);
    const orgName = (org.name || formConfig.organisation_name || '').trim();
    const pageTitle = (formConfig.title || 'Become a Member').trim();

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Org name.
    if (orgName) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(20, 20, 20);
      doc.text(orgName, margin, y + 12);
      y += 30;
    }

    // Membership page title.
    if (pageTitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(12);
      doc.setTextColor(90, 90, 90);
      doc.text(pageTitle, margin, y);
      y += 22;
    }

    // Document title.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text('Membership Application', margin, y);
    y += 22;

    // Meta line.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(`Applicant: ${submission.member_name || '—'}`, margin, y);
    y += 15;
    doc.text(`Membership Plan: ${submission.membership_structure_name || '—'}`, margin, y);
    y += 15;
    doc.text(`Submitted: ${formatDate(submission.submitted_at || submission.created_date, timeZone)}`, margin, y);
    y += 18;

    // Divider.
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, y, pageWidth - margin, y);
    y += 22;

    // Answers.
    const answers = Array.isArray(submission.answers) ? submission.answers : [];

    const ensureSpace = (needed) => {
      if (y + needed > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
    };

    if (answers.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(130, 130, 130);
      doc.text('No form responses were recorded for this submission.', margin, y);
    } else {
      for (const a of answers) {
        const label = a.label || a.question_id || 'Question';
        const valueText = formatValue(a.value);

        // Label
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(60, 60, 60);
        const labelLines = doc.splitTextToSize(label, contentWidth);

        // Value
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        const valueLines = doc.splitTextToSize(valueText, contentWidth);

        const blockHeight = labelLines.length * 14 + valueLines.length * 15 + 12;
        ensureSpace(blockHeight);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(90, 90, 90);
        doc.text(labelLines, margin, y);
        y += labelLines.length * 14 + 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(20, 20, 20);
        doc.text(valueLines, margin, y);
        y += valueLines.length * 15 + 12;
      }
    }

    const pdfBytes = doc.output('arraybuffer');
    const safeName = (submission.member_name || 'submission').replace(/[^a-z0-9]+/gi, '_');
    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${safeName}_membership_application.pdf`,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});