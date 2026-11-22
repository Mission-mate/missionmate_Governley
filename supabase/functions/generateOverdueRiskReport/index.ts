import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { readClientToday, INVALID_TODAY } from '../_shared/clientDate.ts';
import { normaliseConfig, schemaForSections, verbosity } from '../_shared/riskReportConfig.ts';

export default async function handler(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error:'Unauthorized' }, { status:401 });
    const body = await req.json().catch(() => ({}));
    const allowed = ['executive_summary','key_themes','overdue_items','governance','recommendations','outlook','risk_appetite','category_analysis','review_cadence','owner_accountability'];
    const today = readClientToday(body);
    if (!today) return INVALID_TODAY();
    const config = normaliseConfig(body, allowed);
    const risks = await base44.entities.Risk.list('-created_date');
    const weights = { 'Very High':5, High:4, Tolerable:3, Low:2, 'Very Low':1 };
    const days = (date) => Math.max(0, Math.round((new Date(`${today}T00:00:00Z`)-new Date(`${date}T00:00:00Z`))/86400000));
    const overdue = risks.filter((risk) => risk.next_review_date && risk.next_review_date < today && (risk.status || 'Active') !== 'Closed').map((risk) => ({ risk_id:risk.risk_id || '', title:risk.title || 'Untitled risk', category:risk.category || 'Uncategorised', owner:risk.owner || '—', residual_rating:risk.residual_rating || risk.inherent_rating || '—', appetite:risk.risk_appetite || '—', status:risk.status || 'Active', last_reviewed_date:risk.last_reviewed_date || null, next_review_date:risk.next_review_date, days_overdue:days(risk.next_review_date), weight:weights[risk.residual_rating || risk.inherent_rating] || 0 })).sort((a,b) => b.weight-a.weight || b.days_overdue-a.days_overdue);
    const ratingCounts = { 'Very Low':0, Low:0, Tolerable:0, High:0, 'Very High':0 }, categoryCounts = {}, ownerCounts = {};
    overdue.forEach((risk) => { if (ratingCounts[risk.residual_rating] != null) ratingCounts[risk.residual_rating] += 1; categoryCounts[risk.category]=(categoryCounts[risk.category]||0)+1; ownerCounts[risk.owner]=(ownerCounts[risk.owner]||0)+1; });
    const total=overdue.length, outsideAppetite=overdue.filter((risk) => risk.appetite === 'Outside Appetite').length;
    const metrics = { total, outsideAppetite, criticalCount:overdue.filter((risk) => risk.weight >= 4).length, maxOverdue:overdue.reduce((max,risk) => Math.max(max,risk.days_overdue),0), avgOverdue:total ? Math.round(overdue.reduce((sum,risk) => sum+risk.days_overdue,0)/total) : 0, ratingCounts, categoryCounts, ownerCounts };
    const rows = overdue.slice(0,120).map((risk) => `${risk.risk_id} ${risk.title} | ${risk.residual_rating} | ${risk.appetite} | ${risk.category} | owner ${risk.owner} | ${risk.days_overdue} days overdue`).join('\n');
    const instructions = { executive_summary:'executive_summary: overdue-review exposure and headline message; risk_posture_statement: one severity sentence.', key_themes:'key_themes: themes with title and detail.', overdue_items:'top_risks_commentary: urgent overdue risks and why they come first.', governance:'governance_findings: findings with title, detail and severity.', recommendations:'recommendations: prioritised actions to clear and prevent backlog.', outlook:'outlook: forward-looking review-compliance statement.', risk_appetite:'risk_appetite_assessment: appetite breaches among overdue risks.', category_analysis:'category_analysis: category concentration in the backlog.', review_cadence:'review_cadence: age, cadence and review-discipline analysis.', owner_accountability:'owner_accountability: owner concentration and required accountability.' };
    const requested = config.sections.map((id) => `- ${instructions[id]}`).filter(Boolean).join('\n');
    const dataset = `As at ${today}: ${total} overdue reviews; ${metrics.criticalCount} High/Very High; ${outsideAppetite} outside appetite; longest ${metrics.maxOverdue} days; average ${metrics.avgOverdue}. Ratings ${JSON.stringify(ratingCounts)}. Categories ${JSON.stringify(categoryCounts)}. Owners ${JSON.stringify(ownerCounts)}.\n${rows || 'No overdue risks.'}`;
    const prompt = `You are the Chief Risk Officer preparing an Overdue Risks Report. Never invent data. ${verbosity[config.length]}\nProduce only these selected sections:\n${requested}\n\nDATA:\n${dataset}`;
    const narrative = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema:schemaForSections(config.sections) });
    const snapshot = { report_type:'overdue_risks', generated_at:new Date().toISOString(), generated_by:user.full_name || user.email || 'Unknown', config, metrics, items:overdue, narrative };
    const existing = await base44.entities.AppConfig.filter({ key:'risk_report_overdue_risks' });
    if (existing?.[0]) await base44.entities.AppConfig.update(existing[0].id,{ settings:snapshot }); else await base44.entities.AppConfig.create({ key:'risk_report_overdue_risks', settings:snapshot });
    return Response.json({ snapshot });
  } catch (error) { return Response.json({ error:error.message }, { status:500 }); }
}

serve(handler);
