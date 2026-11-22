import React from 'react';
import ReactMarkdown from 'react-markdown';
import { AlertCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import RatingBadge from '@/components/risk/RatingBadge';
import { cn } from '@/lib/utils';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import { getAppetiteStyle } from '@/components/risk/detail/statusStyles';
import NarrativeSection from './NarrativeSection';
import { selectedSections } from '@/lib/riskReportSections';

const SEVERITY = {
  critical: { icon: AlertCircle, dot: 'text-red-500' },
  warning: { icon: AlertTriangle, dot: 'text-amber-500' },
  info: { icon: Info, dot: 'text-blue-500' },
};

function Section({ title, children }) {
  return (
    <section>
      <h3 className="text-base font-bold text-foreground border-l-[3px] border-primary pl-2.5 mb-3">{title}</h3>
      {children}
    </section>
  );
}

function MetricTile({ label, value, accent }) {
  return (
    <div className={cn(ELEVATED_CARD, 'p-4')}>
      <p className={cn('text-2xl font-bold', accent || 'text-foreground')}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export default function OverdueReportBody({ snapshot, reportType }) {
  const { metrics = {}, items = [], narrative = {} } = snapshot || {};
  const isTreatment = reportType.id === 'overdue_treatments';
  const chosen = selectedSections(snapshot, reportType.id);
  const enabled = (id) => chosen.includes(id);

  const tiles = isTreatment
    ? [
        { label: 'Overdue Actions', value: metrics.total ?? 0, accent: 'text-red-600' },
        { label: 'Risks Affected', value: metrics.affectedRisks ?? 0 },
        { label: 'On Critical Risks', value: metrics.criticalCount ?? 0 },
        { label: 'Max Days Overdue', value: metrics.maxOverdue ?? 0, accent: 'text-red-600' },
      ]
    : [
        { label: 'Overdue Risks', value: metrics.total ?? 0, accent: 'text-red-600' },
        { label: 'Critically Rated', value: metrics.criticalCount ?? 0 },
        { label: 'Outside Appetite', value: metrics.outsideAppetite ?? 0 },
        { label: 'Max Days Overdue', value: metrics.maxOverdue ?? 0, accent: 'text-red-600' },
      ];

  return (
    <div className="space-y-7">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map((t) => <MetricTile key={t.label} {...t} />)}
      </div>

      {enabled('executive_summary') && <Section title="Executive Summary">
        {narrative.risk_posture_statement && (
          <p className="text-[15px] font-semibold text-foreground leading-snug mb-2">{narrative.risk_posture_statement}</p>
        )}
        <div className="prose prose-sm max-w-none text-muted-foreground">
          <ReactMarkdown>{narrative.executive_summary || '_No summary generated._'}</ReactMarkdown>
        </div>
      </Section>}

      {enabled('key_themes') && narrative.key_themes?.length > 0 && (
        <Section title="Key Themes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {narrative.key_themes.map((t, i) => (
              <div key={i} className={cn(ELEVATED_CARD, 'p-4')}>
                <p className="text-sm font-semibold text-foreground">{t.title}</p>
                {t.detail && <p className="text-sm text-muted-foreground mt-1">{t.detail}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {enabled('overdue_items') && <Section title={isTreatment ? 'Overdue Treatment Actions' : 'Overdue Risks'}>
        {items.length === 0 ? (
          <div className={cn(ELEVATED_CARD, 'py-10 text-center text-sm text-muted-foreground')}>
            Nothing overdue — all {isTreatment ? 'treatment actions are on schedule' : 'risk reviews are up to date'}.
          </div>
        ) : (
          <div className={cn(ELEVATED_CARD, 'overflow-hidden')}>
            <table className="w-full">
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-left">
                  {isTreatment ? (
                    <>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Action</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Risk</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Rating</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Priority</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide text-right">Overdue</th>
                    </>
                  ) : (
                    <>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Risk</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Rating</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Appetite</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide">Owner</th>
                      <th className="px-3 py-2.5 text-xs font-semibold text-foreground/80 uppercase tracking-wide text-right">Overdue</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((it, i) => (
                  <tr key={i} className="hover:bg-sidebar-accent/70 transition-colors">
                    {isTreatment ? (
                      <>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{it.action}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{it.strategy} · {it.owner}</p>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm text-foreground line-clamp-1">{it.risk_title}</p>
                          {it.risk_id && <p className="text-xs text-muted-foreground mt-0.5">{it.risk_id}</p>}
                        </td>
                        <td className="px-3 py-3"><RatingBadge rating={it.residual_rating} /></td>
                        <td className="px-3 py-3 text-sm text-foreground">{it.priority}</td>
                        <td className="px-3 py-3 text-right"><span className="text-sm font-semibold text-red-600">{it.days_overdue} days</span></td>
                      </>
                    ) : (
                      <>
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium text-foreground line-clamp-1">{it.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{it.risk_id ? `${it.risk_id} · ` : ''}Review due {it.next_review_date}</p>
                        </td>
                        <td className="px-3 py-3"><RatingBadge rating={it.residual_rating} /></td>
                        <td className="px-3 py-3">
                          {it.appetite && it.appetite !== '—'
                            ? <span className={cn('inline-block text-xs px-2 py-0.5 rounded-full font-medium', getAppetiteStyle(it.appetite))}>{it.appetite}</span>
                            : <span className="text-muted-foreground/50 text-sm">—</span>}
                        </td>
                        <td className="px-3 py-3 text-sm text-foreground">{it.owner}</td>
                        <td className="px-3 py-3 text-right"><span className="text-sm font-semibold text-red-600">{it.days_overdue} days</span></td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {narrative.top_risks_commentary && (
          <div className="prose prose-sm max-w-none text-muted-foreground mt-3">
            <ReactMarkdown>{narrative.top_risks_commentary}</ReactMarkdown>
          </div>
        )}
      </Section>}

      {enabled('risk_appetite') && <NarrativeSection title="Risk Appetite Assessment" content={narrative.risk_appetite_assessment} />}
      {enabled('category_analysis') && <NarrativeSection title="Risk by Category" content={narrative.category_analysis} />}
      {enabled('treatment_progress') && <NarrativeSection title="Treatment Action Progress" content={narrative.treatment_progress} />}
      {enabled('control_effectiveness') && <NarrativeSection title="Control Effectiveness Review" content={narrative.control_effectiveness} />}
      {enabled('review_cadence') && <NarrativeSection title="Review Cadence & Overdue Reviews" content={narrative.review_cadence} />}
      {enabled('owner_accountability') && <NarrativeSection title="Risk Owner Accountability" content={narrative.owner_accountability} />}

      {enabled('governance') && narrative.governance_findings?.length > 0 && (
        <Section title="Findings">
          <div className={cn(ELEVATED_CARD, 'px-4 py-1 divide-y divide-border/60')}>
            {narrative.governance_findings.map((f, i) => {
              const sev = SEVERITY[f.severity] || SEVERITY.info;
              const Icon = sev.icon;
              return (
                <div key={i} className="flex items-start gap-3 py-3">
                  <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${sev.dot}`} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{f.title}</p>
                    {f.detail && <p className="text-sm text-muted-foreground mt-0.5">{f.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {enabled('recommendations') && narrative.recommendations?.length > 0 && (
        <Section title="Recommendations">
          <ul className="space-y-2.5">
            {narrative.recommendations.map((r, i) => (
              <li key={i} className="flex gap-3 bg-card border border-border rounded-lg p-3.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                <span className="text-sm text-foreground">{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {enabled('outlook') && narrative.outlook && (
        <Section title="Outlook">
          <div className="bg-gradient-to-br from-primary/[0.04] to-violet-500/[0.04] border border-border rounded-xl p-5">
            <div className="flex gap-3">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="prose prose-sm max-w-none text-muted-foreground">
                <ReactMarkdown>{narrative.outlook}</ReactMarkdown>
              </div>
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}