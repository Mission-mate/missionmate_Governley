import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { readClientToday, INVALID_TODAY } from '../_shared/clientDate.ts';
import { normaliseConfig, schemaForSections, verbosity } from '../_shared/riskReportConfig.ts';

export default async function handler(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const allowed = ['executive_summary','key_themes','top_risks','governance','recommendations','outlook','risk_appetite','category_analysis','inherent_residual','treatment_progress','control_effectiveness','review_cadence','owner_accountability','rating_trends','closed_risks'];
    const today = readClientToday(body);
    if (!today) return INVALID_TODAY();
    const config = normaliseConfig(body, allowed);
    const risks = await base44.entities.Risk.list('-created_date');
    const matrix = { 5:['Tolerable','High','Very High','Very High','Very High'], 4:['Low','Tolerable','High','Very High','Very High'], 3:['Low','Low','Tolerable','High','High'], 2:['Very Low','Low','Tolerable','Tolerable','High'], 1:['Very Low','Very Low','Low','Tolerable','Tolerable'] };
    const calcRating = (l,c) => matrix[Number(c)]?.[Number(l)-1] || null;
    const calcScore = (l,c) => Number(l || 0) * Number(c || 0);
    const ratingCounts = { 'Very Low':0, Low:0, Tolerable:0, High:0, 'Very High':0 };
    const categoryCounts = {}, ownerCounts = {}, controlCounts = { total:0, designEffective:0, operatingEffective:0, notAssessed:0 };
    let totalInherent=0, totalResidual=0, actionsTotal=0, actionsCompleted=0, actionsOverdue=0, reviewsOverdue=0, ratingMovements=0;
    for (const risk of risks) {
      const residual = risk.residual_rating || calcRating(risk.residual_likelihood, risk.residual_consequence) || risk.inherent_rating;
      if (ratingCounts[residual] != null) ratingCounts[residual] += 1;
      const category = risk.category || 'Uncategorised', owner = risk.owner || 'Unassigned';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
      totalInherent += calcScore(risk.inherent_likelihood, risk.inherent_consequence);
      totalResidual += calcScore(risk.residual_likelihood, risk.residual_consequence);
      for (const control of risk.existing_controls || []) {
        controlCounts.total += 1;
        if (control.design_effectiveness === 'Effective') controlCounts.designEffective += 1;
        if (control.operating_effectiveness === 'Effective') controlCounts.operatingEffective += 1;
        if (!control.operating_effectiveness || control.operating_effectiveness === 'Not Assessed') controlCounts.notAssessed += 1;
      }
      for (const action of risk.treatment_plan || []) {
        actionsTotal += 1;
        if (action.status === 'Completed') actionsCompleted += 1;
        if (action.status !== 'Completed' && action.due_date && action.due_date < today) actionsOverdue += 1;
      }
      if (risk.next_review_date && risk.next_review_date < today && (risk.status || 'Active') !== 'Closed') reviewsOverdue += 1;
      ratingMovements += (risk.rating_history || []).reduce((sum, entry) => sum + (entry.changes || []).filter((change) => /rating/i.test(change.field || '')).length, 0);
    }
    const total = risks.length, active = risks.filter((risk) => (risk.status || 'Active') !== 'Closed').length;
    const outsideAppetite = risks.filter((risk) => risk.risk_appetite === 'Outside Appetite').length;
    const topRisks = risks.map((risk) => ({ risk_id:risk.risk_id || '', title:risk.title || 'Untitled risk', category:risk.category || 'Uncategorised', owner:risk.owner || '—', residual_rating:risk.residual_rating || calcRating(risk.residual_likelihood,risk.residual_consequence) || risk.inherent_rating || '—', score:calcScore(risk.residual_likelihood,risk.residual_consequence), appetite:risk.risk_appetite || '—' })).filter((risk) => risk.score > 0).sort((a,b) => b.score-a.score).slice(0,5);
    const closedRisks = risks.filter((risk) => risk.status === 'Closed').map((risk) => `${risk.risk_id || ''} ${risk.title || 'Untitled risk'}`);
    const metrics = { total, active, closed:total-active, outsideAppetite, ratingCounts, categoryCounts, ownerCounts, totalInherent, totalResidual, riskReduction:totalInherent ? Math.round(((totalInherent-totalResidual)/totalInherent)*100) : 0, actionsTotal, actionsCompleted, actionsOverdue, actionCompletionRate:actionsTotal ? Math.round((actionsCompleted/actionsTotal)*100) : 0, reviewsOverdue, controlCounts, ratingMovements };
    const lines = risks.slice(0,150).map((risk) => `${risk.risk_id || ''} ${risk.title || '(untitled)'} | Category: ${risk.category || '—'} | Owner: ${risk.owner || '—'} | Inherent: ${risk.inherent_rating || calcRating(risk.inherent_likelihood,risk.inherent_consequence) || '—'} | Residual: ${risk.residual_rating || calcRating(risk.residual_likelihood,risk.residual_consequence) || '—'} | Appetite: ${risk.risk_appetite || '—'} | Status: ${risk.status || 'Active'}`).join('\n');
    const dataset = `As at ${today}: ${total} risks (${active} active, ${total-active} closed); ${outsideAppetite} outside appetite. Ratings: ${JSON.stringify(ratingCounts)}. Categories: ${JSON.stringify(categoryCounts)}. Owners: ${JSON.stringify(ownerCounts)}. Inherent score ${totalInherent}; residual score ${totalResidual}; reduction ${metrics.riskReduction}%. Actions: ${actionsTotal} total, ${actionsCompleted} completed, ${actionsOverdue} overdue. Reviews overdue: ${reviewsOverdue}. Controls: ${JSON.stringify(controlCounts)}. Rating movements recorded: ${ratingMovements}. Closed risks: ${closedRisks.join('; ') || 'none'}.\nTOP RISKS:\n${topRisks.map((risk) => `${risk.title} (${risk.residual_rating}, score ${risk.score})`).join('\n') || 'none'}\nREGISTER:\n${lines || 'No risks recorded.'}`;
    const instructions = {
      executive_summary:'executive_summary: overall posture and headline board message; risk_posture_statement: one strong trajectory sentence.', key_themes:'key_themes: strategic themes with title and detail.', top_risks:'top_risks_commentary: commentary on the most significant residual risks.', governance:'governance_findings: governance findings with title, detail and severity.', recommendations:'recommendations: concrete prioritised board actions.', outlook:'outlook: forward-looking trajectory and watch items.', risk_appetite:'risk_appetite_assessment: analyse appetite breaches and board implications.', category_analysis:'category_analysis: analyse category concentration and severity.', inherent_residual:'inherent_residual_analysis: compare inherent and residual exposure and control impact.', treatment_progress:'treatment_progress: assess completion, overdue and stalled treatment delivery.', control_effectiveness:'control_effectiveness: assess design and operating effectiveness and assessment gaps.', review_cadence:'review_cadence: assess overdue reviews and review discipline.', owner_accountability:'owner_accountability: assess owner concentration and accountability.', rating_trends:'rating_trends: explain recorded rating movements without inventing direction.', closed_risks:'closed_risks: summarise closed risks and what their closure means.'
    };
    const requested = config.sections.map((id) => `- ${instructions[id]}`).filter(Boolean).join('\n');
    const prompt = `You are the Chief Risk Officer preparing a board-ready Comprehensive Risk Report. Never invent data. ${verbosity[config.length]}\nProduce only these selected sections:\n${requested}\n\nDATA:\n${dataset}`;
    const narrative = await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema:schemaForSections(config.sections) });
    const snapshot = { report_type:'comprehensive', generated_at:new Date().toISOString(), generated_by:user.full_name || user.email || 'Unknown', config, metrics, topRisks, narrative };
    const existing = await base44.entities.AppConfig.filter({ key:'risk_report_snapshot' });
    if (existing?.[0]) await base44.entities.AppConfig.update(existing[0].id, { settings:snapshot }); else await base44.entities.AppConfig.create({ key:'risk_report_snapshot', settings:snapshot });
    return Response.json({ snapshot });
  } catch (error) { return Response.json({ error:error.message }, { status:500 }); }
}

serve(handler);
