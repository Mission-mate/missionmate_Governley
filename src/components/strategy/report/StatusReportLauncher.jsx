import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { localToday } from '@/lib/localClock';
import ToolbarButton from '@/components/shared/table/ToolbarButton';
import StrategyReportConfigModal from './StrategyReportConfigModal';
import StrategyReportPane from './StrategyReportPane';

/** Toolbar entry point for the AI Strategy Status Report: generate, view and download as PDF. */
export default function StatusReportLauncher({ strategy }) {
  const [configOpen, setConfigOpen] = useState(false);
  const [paneOpen, setPaneOpen] = useState(false);
  const [report, setReport] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const generate = async ({ length, sections }) => {
    setConfigOpen(false);
    setReport(null);
    setError(null);
    setIsGenerating(true);
    setPaneOpen(true);
    try {
      const res = await base44.functions.invoke('generateStrategyStatusReport', {
        strategy_id: strategy.id,
        length,
        sections,
        today: localToday(),
      });
      if (res.data?.error) setError(res.data.error);
      else setReport(res.data?.report || null);
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <ToolbarButton icon={Sparkles} label="Status Report" onClick={() => setConfigOpen(true)} />

      <StrategyReportConfigModal open={configOpen} onOpenChange={setConfigOpen} onGenerate={generate} />

      <StrategyReportPane
        isOpen={paneOpen}
        onClose={() => setPaneOpen(false)}
        report={report}
        isGenerating={isGenerating}
        error={error}
      />
    </>
  );
}