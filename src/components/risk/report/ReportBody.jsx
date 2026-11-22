import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import ReportMetrics from './ReportMetrics';
import RatingDistributionBar from './RatingDistributionBar';
import TopRisksTable from './TopRisksTable';
import NarrativeSection from './NarrativeSection';
import { selectedSections } from '@/lib/riskReportSections';

const SEVERITY = { critical: { icon: AlertCircle, dot: 'text-red-500' }, warning: { icon: AlertTriangle, dot: 'text-amber-500' }, info: { icon: Info, dot: 'text-blue-500' } };
function Section({ title, children }) { return <section><h3 className="text-base font-bold text-foreground border-l-[3px] border-primary pl-2.5 mb-3">{title}</h3>{children}</section>; }
const EXTRA = [
  ['risk_appetite', 'Risk Appetite Assessment', 'risk_appetite_assessment'],
  ['category_analysis', 'Risk by Category', 'category_analysis'],
  ['inherent_residual', 'Inherent vs Residual Analysis', 'inherent_residual_analysis'],
  ['treatment_progress', 'Treatment Action Progress', 'treatment_progress'],
  ['control_effectiveness', 'Control Effectiveness Review', 'control_effectiveness'],
  ['review_cadence', 'Review Cadence & Overdue Reviews', 'review_cadence'],
  ['owner_accountability', 'Risk Owner Accountability', 'owner_accountability'],
  ['rating_trends', 'Rating Trend & Movements', 'rating_trends'],
  ['closed_risks', 'Closed Risks Summary', 'closed_risks'],
];

export default function ReportBody({ snapshot }) {
  const { metrics, topRisks = [], narrative = {} } = snapshot || {};
  const chosen = selectedSections(snapshot, 'comprehensive');
  const enabled = (id) => chosen.includes(id);
  return <div className="space-y-7">
    <ReportMetrics metrics={metrics} />
    <Section title="Residual Risk Profile"><div className="bg-card border border-border rounded-xl p-5"><RatingDistributionBar ratingCounts={metrics?.ratingCounts} /></div></Section>
    {enabled('executive_summary') && <Section title="Executive Summary">
      {narrative.risk_posture_statement && <p className="text-[15px] font-semibold text-foreground leading-snug mb-2">{narrative.risk_posture_statement}</p>}
      <div className="prose prose-sm max-w-none text-muted-foreground"><ReactMarkdown>{narrative.executive_summary || '_No summary generated._'}</ReactMarkdown></div>
    </Section>}
    {enabled('key_themes') && narrative.key_themes?.length > 0 && <NarrativeSection title="Key Strategic Themes" content={narrative.key_themes} />}
    {enabled('top_risks') && <Section title="Top Residual Risks"><TopRisksTable risks={topRisks} />{narrative.top_risks_commentary && <div className="prose prose-sm max-w-none text-muted-foreground mt-3"><ReactMarkdown>{narrative.top_risks_commentary}</ReactMarkdown></div>}</Section>}
    {EXTRA.map(([id, title, field]) => enabled(id) ? <NarrativeSection key={id} title={title} content={narrative[field]} /> : null)}
    {enabled('governance') && narrative.governance_findings?.length > 0 && <Section title="Governance & Compliance Findings"><div className="bg-card border border-border rounded-xl px-4 py-1 divide-y divide-border/60">{narrative.governance_findings.map((finding, index) => { const severity = SEVERITY[finding.severity] || SEVERITY.info; const Icon = severity.icon; return <div key={index} className="flex items-start gap-3 py-3"><Icon className={`w-4 h-4 mt-0.5 shrink-0 ${severity.dot}`} /><div><p className="text-sm font-semibold text-foreground">{finding.title}</p>{finding.detail && <p className="text-sm text-muted-foreground mt-0.5">{finding.detail}</p>}</div></div>; })}</div></Section>}
    {enabled('recommendations') && narrative.recommendations?.length > 0 && <Section title="Recommendations for the Board"><ul className="space-y-2.5">{narrative.recommendations.map((item, index) => <li key={index} className="flex gap-3 bg-card border border-border rounded-lg p-3.5"><span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{index + 1}</span><span className="text-sm text-foreground">{item}</span></li>)}</ul></Section>}
    {enabled('outlook') && narrative.outlook && <Section title="Outlook"><div className="bg-gradient-to-br from-primary/[0.04] to-violet-500/[0.04] border border-border rounded-xl p-5"><div className="flex gap-3"><Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" /><div className="prose prose-sm max-w-none text-muted-foreground"><ReactMarkdown>{narrative.outlook}</ReactMarkdown></div></div></div></Section>}
  </div>;
}