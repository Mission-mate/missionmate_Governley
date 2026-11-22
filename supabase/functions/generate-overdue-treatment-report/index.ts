import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { readClientToday, INVALID_TODAY } from '../_shared/clientDate.ts';
import { normaliseConfig, schemaForSections, verbosity } from '../_shared/riskReportConfig.ts';

export default async function handler(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error:'Unauthorized' }, { status:401 });
    const body = await req.json().catch(() => ({}));
    const allowed = ['executive_summary','key_themes','overdue_items','governance','recommendations','outlook','risk_appetite','category_analysis','treatment_progress','control_effectiveness','owner_accountability'];
    const today = readClientToday(body);
    if (!today) return INVALID_TODAY();
    const config = normaliseConfig(body, allowed);
    const risks = await base44.entities.Risk.list('-created_date');
    const ratingWeight = { 'Very High':5, High:4, Tolerable:3, Low:2, 'Very Low':1 }, priorityWeight = { High:3, Medium:2, Low:1 };
    const days = (date) => Math.max(0, Math.round((new Date(`${today}T00:00:00Z`)-new Date(`${date}T00:00:00Z`))/86400000));
    const overdue = [], categoryCounts = {}, ownerCounts = {}, controlCounts = { total:0, effective:0, notAssessed:0 };
    for (const risk of risks) {
      for (const control of risk.existing_controls || []) { controlCounts.total += 1; if (control.operating_effectiveness === 'Effective') controlCounts.effective += 1; if (!control.operating_effectiveness || control.operating_effectiveness === 'Not Assessed') controlCounts.notAssessed += 1; }
      for (const action of risk.treatment_plan || []) if (action.resolve_by === 'Due Date' && action.due_date && action.due_date < today && action.status !== 'Completed') {
        const item = { action:action.title || action.description || action.strategy || 'Treatment action', strategy:action.strategy || '—', owner:action.owner || '—', priority:action.priority || '—', status:action.status || 'Not Started', progress:action.progress || 0, due_date:action.due_date, days_overdue:days(action.due_date), risk_id:risk.risk_id || '', risk_title:risk.title || 'Untitled risk', category:risk.category || 'Uncategorised', residual_rating:risk.residual_rating || risk.inherent_rating || '—', appetite:risk.risk_appetite || '—', risk_status:risk.status || 'Active' };
        item.weight=(ratingWeight[item.residual_rating]||0)*10+(priorityWeight[item.priority]||0); overdue.push(item);
        categoryCounts[item.category]=(categoryCounts[item.category]||0)+1; ownerCounts[item.owner]=(ownerCounts[item.owner]||0)+1;
      }
    }
    overdue.sort((a,b) => b.weight-a.weight || b.days_overdue-a.days_overdue);
    const ratingCounts = { 'Very Low':0, Low:0, Tolerable:0, High:0, 'Very High':0 };
    overdue.forEach((item) => { if (ratingCounts[item.residual_rating] != null) ratingCounts[item.residual_rating] += 1; });
    const total=overdue.length, affectedRisks=new Set(overdue.map((item) => item.risk_id)).size;
    const metrics = { total, affectedRisks, outsideAppetite:overdue.filter((item) => item.appetite === 'Outside Appetite').length, criticalCount:overdue.filter((item) => (ratingWeight[item.residual_rating]||0)>=4).length, maxOverdue:overdue.reduce((max,item) => Math.max(max,item.days_overdue),0), avgOverdue:total ? Math.round(overdue.reduce((sum,item) => sum+item.days_overdue,0)/total) : 0, ratingCounts, categoryCounts, ownerCounts, controlCounts };
    const rows = overdue.slice(0,120).map((item) => `${item.action} | risk ${item.risk_id} ${item.risk_title} | ${item.residual_rating} | ${item.priority} | owner ${item.owner} | ${item.progress}% | ${item.days_overdue} days overdue`).join('\n');
    const instructions = { executive_summary:'executive_summary: treatment backlog exposure and headline message; risk_posture_statement: one severity sentence.', key_themes:'key_themes: themes with title and detail.', overdue_items:'top_risks_commentary: urgent actions and parent risks to escalate.', governance:'governance_findings: findings with title, detail and severity.', recommendations:'recommendations: prioritised actions to clear the backlog.', outlook:'outlook: forward-looking delivery statement.', risk_appetite:'risk_appetite_assessment: appetite exposure protected by overdue actions.', category_analysis:'category_analysis: parent-risk category concentration.', treatment_progress:'treatment_progress: analyse progress, priority and ageing.', control_effectiveness:'control_effectiveness: relate control effectiveness and assessment gaps to treatment urgency.', owner_accountability:'owner_accountability: action-owner concentration and accountability.' };
    const requested = config.sections.map((id) => `- ${instructions[id]}`).filter(Boolean).join('\n');
    const dataset = `As at ${today}: ${total} overdue actions across ${affectedRisks} risks; ${metrics.criticalCount} on High/Very High risks; ${metrics.outsideAppetite} outside appetite; longest ${metrics.maxOverdue} days; average ${metrics.avgOverdue}. Ratings ${JSON.stringify(ratingCounts)}. Categories ${JSON.stringify(categoryCounts)}. Action owners ${JSON.stringify(ownerCounts)}. Parent-risk controls ${JSON.stringify(controlCounts)}.\n${rows || 'No overdue actions.'}`;
    const prompt = `You are the Chief Risk Officer preparing an Overdue Treatment Actions Report. Never invent data. ${verbosity[config.length]}\nProduce only these selected sections:\n${requested}\n\nDATA:\n${dataset}`;
    const narrative = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema:schemaForSections(config.sections) });
    const snapshot = { report_type:'overdue_treatments', generated_at:new Date().toISOString(), generated_by:user.full_name || user.email || 'Unknown', config, metrics, items:overdue, narrative };
    const existing = await base44.entities.AppConfig.filter({ key:'risk_report_overdue_treatments' });
    if (existing?.[0]) await base44.entities.AppConfig.update(existing[0].id,{ settings:snapshot }); else await base44.entities.AppConfig.create({ key:'risk_report_overdue_treatments', settings:snapshot });
    return Response.json({ snapshot });
  } catch (error) { return Response.json({ error:error.message }, { status:500 }); }
}

serve(handler);
