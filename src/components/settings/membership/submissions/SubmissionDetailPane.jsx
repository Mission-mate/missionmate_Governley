import React, { useState } from 'react';
import { Download, FileText, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import SlidePane from '@/components/ui/SlidePane';
import { formatSubmissionDate, formatAnswerValue } from '@/lib/submissionFormat';
import CloseButton from '@/components/shared/CloseButton';
function Field({ label, value, mapped }) {
  return (
    <div className="py-3 border-b border-border/60 last:border-0">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        {mapped && (
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            Mapped
          </span>
        )}
      </div>
      <p className="text-sm text-foreground whitespace-pre-wrap break-words">{formatAnswerValue(value)}</p>
    </div>
  );
}

export default function SubmissionDetailPane({ isOpen, submission, onClose, onDownload }) {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await onDownload(submission);
    } catch {
      toast({ title: 'Error', description: 'Could not download the PDF.', variant: 'destructive' });
    } finally {
      setDownloading(false);
    }
  };

  const answers = Array.isArray(submission?.answers) ? submission.answers : [];

  return (
    <SlidePane isOpen={isOpen} onClose={onClose} className="bg-card shadow-2xl flex flex-col">
      {submission && (
        <>
          {/* Header */}
          <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-foreground truncate">{submission.member_name || 'Submission'}</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {submission.membership_structure_name || 'No plan'} · Submitted {formatSubmissionDate(submission.submitted_at || submission.created_date)}
              </p>
            </div>
            <CloseButton onClick={onClose} className="shrink-0" />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 pb-4 mb-2 border-b border-border">
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Membership Plan</span>
                <p className="text-sm text-foreground">{submission.membership_structure_name || '—'}</p>
              </div>
              <div>
                <span className="text-xs font-semibold text-muted-foreground block mb-1">Date Submitted</span>
                <p className="text-sm text-foreground">{formatSubmissionDate(submission.submitted_at || submission.created_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1 mt-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Form Responses</h3>
            </div>

            {answers.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                No form responses were recorded for this submission.
              </p>
            ) : (
              <div>
                {answers.map((a, i) => (
                  <Field
                    key={a.question_id || i}
                    label={a.label || a.question_id || `Question ${i + 1}`}
                    value={a.value}
                    mapped={!!a.mapped_to}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleDownload} disabled={downloading} className="gap-1.5">
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              Download PDF
            </Button>
          </div>
        </>
      )}
    </SlidePane>
  );
}