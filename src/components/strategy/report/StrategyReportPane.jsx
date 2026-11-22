import React from 'react';
import { Download, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CloseButton from '@/components/shared/CloseButton';
import SlidePane from '@/components/ui/SlidePane';
import { LoaderOne } from '@/components/ui/loaders';
import StrategyReportBody from './StrategyReportBody';
import { downloadStrategyReportPdf } from '@/lib/strategy/statusReportPdf';

/** Slide pane showing a generated Strategy Status Report. */
export default function StrategyReportPane({ isOpen, onClose, report, isGenerating, error }) {
  const generated = report?.generated_at ? new Date(report.generated_at) : null;

  return (
    <SlidePane isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="h-full bg-background flex flex-col">
        <div className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <h2 className="text-lg font-bold text-foreground truncate">Strategy Status Report</h2>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isGenerating
                ? 'Analysing your strategy data…'
                : generated
                  ? `As at ${generated.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} • ${report?.metrics?.strategy?.title || 'Strategy'}`
                  : 'Board-ready status report'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {report && !isGenerating && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs"
                  onClick={() => downloadStrategyReportPdf(report)}
                >
                  <Download className="w-3.5 h-3.5" />
                  PDF
                </Button>
              </>
            )}
            <CloseButton onClick={onClose} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isGenerating ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <LoaderOne size="lg" />
              <p className="text-sm text-muted-foreground">Calculating your strategy metrics and writing the report…</p>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <p className="text-sm font-semibold text-foreground">Could not generate the report</p>
              <p className="text-sm text-muted-foreground max-w-md">{error}</p>
            </div>
          ) : report ? (
            <StrategyReportBody report={report} />
          ) : null}
        </div>
      </div>
    </SlidePane>
  );
}