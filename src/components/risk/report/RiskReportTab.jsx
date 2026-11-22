import React, { useState, useEffect } from 'react';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { motion } from 'framer-motion';
import { Sparkles, RefreshCw, Download, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { generateRiskReport, getRiskReportSnapshot } from '@/lib/riskReport';
import { downloadRiskReportPdf } from '@/lib/riskReportPdf';
import { downloadOverdueReportPdf } from '@/lib/overdueReportPdf';
import { REPORT_TYPES, getReportType } from '@/lib/riskReportTypes';
import { useOrgProfile } from '@/hooks/useOrgProfile';
import ReportBody from './ReportBody';
import OverdueReportBody from './OverdueReportBody';
import ReportConfigModal from './ReportConfigModal';
import ModuleLoader from '@/components/shared/states/ModuleLoader';
import LoadError from '@/components/shared/states/LoadError';

function formatTimestamp(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export default function RiskReportTab() {
  const { name: orgName } = useOrgProfile();
  const [selectedType, setSelectedType] = useState('comprehensive');
  // Per-type snapshot cache so switching types keeps each last-generated report.
  const [snapshots, setSnapshots] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const [error, setError] = useState(null);
  // Set when saved reports couldn't be read — kept apart from "no report generated yet".
  const [loadFailed, setLoadFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const reportType = getReportType(selectedType);
  const snapshot = snapshots[selectedType] ?? null;

  const loadSnapshots = async () => {
    try {
      const results = await Promise.all(REPORT_TYPES.map((rt) => getRiskReportSnapshot(rt.id)));
      const map = {};
      REPORT_TYPES.forEach((rt, i) => { map[rt.id] = results[i]; });
      setSnapshots(map);
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSnapshots(); }, []);

  const retryLoad = async () => {
    setRetrying(true);
    await loadSnapshots();
    setRetrying(false);
  };

  const handleGenerate = async (config) => {
    setConfigOpen(false);
    setGenerating(true);
    setError(null);
    try {
      const fresh = await generateRiskReport(selectedType, config);
      setSnapshots((prev) => ({ ...prev, [selectedType]: fresh }));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || 'Failed to generate the report.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!snapshot) return;
    if (selectedType === 'comprehensive') {
      downloadRiskReportPdf(snapshot, orgName || 'Organisation');
    } else {
      downloadOverdueReportPdf(snapshot, reportType, orgName || 'Organisation');
    }
  };

  if (loading) {
    return <ModuleLoader />;
  }

  if (loadFailed) {
    return <LoadError failure={{ refetch: retryLoad, isFetching: retrying }} title="Couldn’t load saved reports" />;
  }

  const Icon = reportType.icon;

  return (
    <div className="space-y-6">
      {/* Action header */}
      <div className="border border-border rounded-xl bg-gradient-to-br from-primary/[0.04] to-violet-500/[0.04] dark:from-primary/10 dark:to-card p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-violet-500 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">{reportType.label}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {snapshot?.generated_at ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Last generated {formatTimestamp(snapshot.generated_at)}
                    {snapshot.generated_by ? ` · by ${snapshot.generated_by}` : ''}
                  </span>
                ) : (
                  reportType.description
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {snapshot && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-border bg-card/70 dark:bg-card text-sm font-medium text-foreground hover:bg-card transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            )}
            <button
              onClick={() => setConfigOpen(true)}
              disabled={generating}
              className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {snapshot ? 'Regenerate' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg px-4 py-3">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {generating && (
        <div className="flex items-center gap-3 py-10 justify-center text-sm text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          Analysing the risk register and drafting the assessment…
        </div>
      )}

      {!generating && snapshot && (
        <motion.div key={selectedType} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          {selectedType === 'comprehensive'
            ? <ReportBody snapshot={snapshot} />
            : <OverdueReportBody snapshot={snapshot} reportType={reportType} />}
        </motion.div>
      )}

      {!generating && !snapshot && !error && (
        <div className={`${ELEVATED_CARD} py-16 px-6 text-center`}>
          <ShieldCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
          <h3 className="text-base font-semibold text-foreground">No report generated yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{reportType.emptyHint}</p>
        </div>
      )}
      <ReportConfigModal open={configOpen} onOpenChange={setConfigOpen} reportType={reportType} initialConfig={snapshot?.config} onGenerate={handleGenerate} />
    </div>
  );
}