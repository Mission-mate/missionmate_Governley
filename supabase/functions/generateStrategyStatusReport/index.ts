import { createClientFromRequest, serve } from '../_shared/base44.ts';
import { orgClock } from '../_shared/orgClock.ts';
import { readClientToday, INVALID_TODAY } from '../_shared/clientDate.ts';
import {
  blankHealthCounts,
  blankStatusCounts,
  layerSlot,
  normaliseConfig,
  normaliseHealth,
  normaliseStatus,
  resolveLayers,
  schemaForSections,
  sectionInstructions,
  stripHtml,
  verbosity,
} from '../_shared/strategyReportConfig.ts';

/**
 * AI Strategy Status Report.
 *
 * Every statistic is computed here in code (never by the model) and handed to the
 * LLM as precomputed_stats. The model only writes prose for the sections the user
 * selected. Nothing is persisted — saving is an explicit user action.
 *
 * The analysis is strictly POINT IN TIME: the current state of every item as at
 * the report date. Nothing is compared against the strategy's start/end period.
 */
export default async function handler(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const strategyId = body?.strategy_id;
    if (!strategyId) return Response.json({ error: 'strategy_id is required' }, { status: 400 });

    const strategy = await base44.entities.Strategy.get(strategyId);
    if (!strategy) return Response.json({ error: 'Strategy not found' }, { status: 404 });

    const config = normaliseConfig(body);
    const blocks = await base44.entities.StrategyBlock.filter({ strategy_id: strategyId }, 'level');
    // "As at" date = the requester's device day; the org clock only labels the generation timestamp.
    const today = readClientToday(body);
    if (!today) return INVALID_TODAY();
    const clock = await orgClock(base44);

    const layers = resolveLayers(strategy);
    const layerByLevel = {};
    layers.forEach((l, index) => { layerByLevel[l.level] = { ...l, index }; });
    const blockIds = new Set(blocks.map((b) => b.id));

    const GOAL_LEVEL = layerSlot('priorities');
    const MEASURE_LEVEL = layerSlot('measures');
    const goalLayerName = layerByLevel[GOAL_LEVEL]?.name || 'Goals';

    // ---- Deterministic helpers -------------------------------------------------
    const dayDiff = (from, to) => Math.round((new Date(to) - new Date(from)) / 86400000);
    const progressOf = (b) => Math.max(0, Math.min(100, Math.round(Number(b.progress || 0))));
    const dueOf = (b) => b.due_date || b.end_date || '';
    const ownerOf = (b) => (b.owners || []).filter(Boolean)[0] || b.owner || '';
    const linked = (b) => blockIds.has(b.contributes_to) || blockIds.has(b.parent_id);
    const layerName = (b) => layerByLevel[b.level]?.name || `Level ${b.level}`;
    const lastUpdatedOf = (b) =>
      (b.last_updated || (b.updated_date ? String(b.updated_date).slice(0, 10) : '')) || '';

    const health = {};
    const status = {};
    blocks.forEach((b) => {
      health[b.id] = normaliseHealth(b.health);
      status[b.id] = normaliseStatus(b.status);
    });
    const isDone = (b) => status[b.id] === 'Completed' || progressOf(b) >= 100;
    const isClosed = (b) => status[b.id] === 'Completed' || status[b.id] === 'Cancelled';

    // Vision, Focus Areas and Goals sit at or above the top of the actionable
    // hierarchy, so they can never be orphans.
    const TOP_SLOTS = new Set(['vision', 'theme', 'priorities'].map(layerSlot));
    const canBeOrphan = (b) => !TOP_SLOTS.has(b.level);
    const isOrphan = (b) => canBeOrphan(b) && !b.parent_id && !linked(b);

    // ---- Latest update note per item ------------------------------------------
    const notes = await base44.entities.NotePage.filter(
      { object_type: 'strategy_deliverable', object_id: { $in: [...blockIds] } }, '-created_date');
    const latestNote = {};
    for (const n of notes) {
      if (!n.object_id || latestNote[n.object_id]) continue;
      latestNote[n.object_id] = {
        title: n.title || '',
        date: n.page_date || (n.created_date ? String(n.created_date).slice(0, 10) : ''),
        text: stripHtml(n.content),
      };
    }

    // ---- Measure values (baseline / current / target) --------------------------
    const measureIds = blocks.filter((b) => b.level === MEASURE_LEVEL).map((b) => b.id);
    const measureValues = {};
    if (measureIds.length) {
      const rows = await base44.entities.StrategyBlockReport.filter({ block_id: { $in: measureIds } });
      const num = (v) => {
        if (v === null || v === undefined || v === '') return null;
        const n = Number(v);
        return Number.isFinite(n) ? n : null;
      };
      // Sum of a field across a row's location children — null when nothing is reported.
      const childSum = (kids, field) => {
        let sum = null;
        for (const k of kids) {
          const n = num(k[field]);
          if (n !== null) sum = (sum ?? 0) + n;
        }
        return sum;
      };

      const byBlock = {};
      const childrenByParent = {};
      for (const r of rows) {
        if (r.parent_id) (childrenByParent[r.parent_id] = childrenByParent[r.parent_id] || []).push(r);
        else (byBlock[r.block_id] = byBlock[r.block_id] || []).push(r);
      }

      for (const [id, list] of Object.entries(byBlock)) {
        list.sort((a, b) => {
          const byDate = String(a.period_date || '').localeCompare(String(b.period_date || ''));
          return byDate !== 0 ? byDate : (a.order_index ?? 0) - (b.order_index ?? 0);
        });
        // Location-based measures record values on child rows, so a period row's
        // own value falls back to the sum of its locations.
        const effective = list.map((r) => {
          const kids = childrenByParent[r.id] || [];
          return {
            period_label: r.period_label || '',
            actual: num(r.actual) ?? childSum(kids, 'actual'),
            expected: num(r.expected) ?? childSum(kids, 'expected'),
            total_expected: num(r.total_expected) ?? childSum(kids, 'total_expected'),
            baseline: num(r.baseline) ?? childSum(kids, 'baseline'),
          };
        });
        // "Current" is the most recent period that actually has a reported value.
        const reported = effective.filter((r) => r.actual !== null);
        const current = reported[reported.length - 1] || null;
        const latest = effective[effective.length - 1];
        const target =
          current?.total_expected ?? latest?.total_expected ?? current?.expected ?? latest?.expected ?? null;
        measureValues[id] = {
          baseline: effective.find((r) => r.baseline !== null)?.baseline ?? null,
          current_value: current?.actual ?? null,
          target,
          latest_period: current?.period_label || latest?.period_label || '',
        };
      }
    }

    /**
     * Current position of a measure as at today — direction-aware, computed in
     * code so the table and the model can never disagree.
     * Higher is Better: >=95% of target = meeting, 70-94% = near, <70% = below.
     * Lower is Better: the comparison is inverted (target ÷ current).
     */
    const positionOf = (current, target, direction) => {
      if (current === null || target === null || target === 0) return 'no_data';
      const pct = direction === 'Lower is Better' ? (target / current) * 100 : (current / target) * 100;
      if (!Number.isFinite(pct)) return 'no_data';
      if (pct >= 95) return 'meeting';
      if (pct >= 70) return 'near';
      return 'below';
    };

    const POSITION_RANK = { below: 0, no_data: 1, near: 2, meeting: 3 };

    // ---- Per-layer rollup -----------------------------------------------------
    const layerStats = [];
    for (const layer of layers) {
      const items = blocks.filter((b) => b.level === layer.level);
      if (!items.length) continue;
      const healthCounts = blankHealthCounts();
      const statusCounts = blankStatusCounts();
      let progressSum = 0;
      let missingOwner = 0;
      let missingHealth = 0;
      let missingDue = 0;
      let unlinked = 0;
      for (const b of items) {
        healthCounts[health[b.id]] += 1;
        statusCounts[status[b.id]] += 1;
        progressSum += progressOf(b);
        if (!ownerOf(b)) missingOwner += 1;
        if (health[b.id] === 'Not Set') missingHealth += 1;
        if (!dueOf(b)) missingDue += 1;
        if (isOrphan(b)) unlinked += 1;
      }
      const completed = items.filter(isDone).length;
      layerStats.push({
        key: layer.key,
        level: layer.level,
        name: layer.name,
        total: items.length,
        completed,
        completion_rate: Math.round((completed / items.length) * 100),
        avg_progress: Math.round(progressSum / items.length),
        health: healthCounts,
        status: statusCounts,
        missing_owner: missingOwner,
        missing_health: missingHealth,
        missing_due_date: missingDue,
        unlinked,
      });
    }

    // ---- Overall rollup -------------------------------------------------------
    const overallHealth = blankHealthCounts();
    const overallStatus = blankStatusCounts();
    const overdueList = [];
    const upcomingList = [];
    const staleList = [];
    const noOwnerList = [];
    const noDueDateList = [];
    const ownerCounts = {};
    const ownerRisk = {};
    const priorityMap = {};
    let progressSum = 0;
    let missingOwner = 0;
    let missingHealth = 0;
    let missingDue = 0;
    let orphans = 0;
    let due30 = 0;
    let due60 = 0;

    const STALE_DAYS = 60;

    for (const b of blocks) {
      const h = health[b.id];
      const s = status[b.id];
      overallHealth[h] += 1;
      overallStatus[s] += 1;
      progressSum += progressOf(b);

      const owner = ownerOf(b);
      const brief = {
        custom_id: b.custom_id || '',
        title: b.title || '(untitled)',
        layer: layerName(b),
        owner: owner || '—',
      };

      if (owner) {
        ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
        if (h === 'At Risk' || h === 'Off Track') {
          (ownerRisk[owner] = ownerRisk[owner] || []).push({ ...brief, health: h, status: s });
        }
      } else {
        missingOwner += 1;
        noOwnerList.push({ ...brief, health: h, status: s });
      }
      if (h === 'Not Set') missingHealth += 1;

      const priority = b.priority || 'Not set';
      const bucket = (priorityMap[priority] = priorityMap[priority] || { priority, total: 0, completed: 0 });
      bucket.total += 1;
      if (isDone(b)) bucket.completed += 1;

      if (isOrphan(b)) orphans += 1;

      const lastUpdated = lastUpdatedOf(b);
      if (!isClosed(b) && (!lastUpdated || dayDiff(lastUpdated, today) >= STALE_DAYS)) {
        staleList.push({
          ...brief,
          last_updated: lastUpdated || 'never',
          days_since_update: lastUpdated ? dayDiff(lastUpdated, today) : null,
          health: h,
          status: s,
        });
      }

      const due = dueOf(b);
      if (!due) {
        missingDue += 1;
        if (!isClosed(b)) noDueDateList.push({ ...brief, health: h, status: s });
        continue;
      }
      if (isClosed(b)) continue;
      if (due < today) {
        overdueList.push({
          ...brief,
          due_date: due,
          days_overdue: dayDiff(due, today),
          status: s,
          health: h,
        });
      } else {
        const inDays = dayDiff(today, due);
        if (inDays <= 30) due30 += 1;
        if (inDays <= 60) {
          due60 += 1;
          upcomingList.push({ ...brief, due_date: due, days_until: inDays, status: s });
        }
      }
    }

    overdueList.sort((a, b) => b.days_overdue - a.days_overdue);
    upcomingList.sort((a, b) => a.days_until - b.days_until);
    staleList.sort((a, b) => (b.days_since_update ?? 9e9) - (a.days_since_update ?? 9e9));

    // ---- Validation gate: every item must land in exactly one bucket ----------
    const total = blocks.length;
    const healthSum = Object.values(overallHealth).reduce((a, n) => a + n, 0);
    const statusSum = Object.values(overallStatus).reduce((a, n) => a + n, 0);
    if (healthSum !== total || statusSum !== total) {
      const problems = [];
      if (healthSum !== total) problems.push(`health counts total ${healthSum} but there are ${total} items (off by ${healthSum - total})`);
      if (statusSum !== total) problems.push(`status counts total ${statusSum} but there are ${total} items (off by ${statusSum - total})`);
      return Response.json({
        error: `Report data validation failed — ${problems.join('; ')}. The report was not generated. Please check the strategy data and try again.`,
      }, { status: 400 });
    }

    // ---- Goal roll-ups --------------------------------------------------------
    const childrenOf = {};
    blocks.forEach((b) => {
      if (b.parent_id) (childrenOf[b.parent_id] = childrenOf[b.parent_id] || []).push(b);
    });
    const descendantsOf = (id, seen = new Set()) => {
      const out = [];
      for (const child of childrenOf[id] || []) {
        if (seen.has(child.id)) continue;
        seen.add(child.id);
        out.push(child, ...descendantsOf(child.id, seen));
      }
      return out;
    };

    const goalRollups = blocks
      .filter((b) => b.level === GOAL_LEVEL)
      .map((goal) => {
        const kids = descendantsOf(goal.id);
        const offTrack = kids.filter((k) => health[k.id] === 'Off Track');
        const highOffTrack = offTrack.filter((k) => k.priority === 'High');
        let rolledHealth = health[goal.id];
        if (highOffTrack.length >= 2) rolledHealth = 'Off Track';
        else if (offTrack.length >= 1 && rolledHealth !== 'Off Track') rolledHealth = 'At Risk';
        const rolledProgress = kids.length
          ? Math.round(kids.reduce((sum, k) => sum + progressOf(k), 0) / kids.length)
          : progressOf(goal);
        return {
          custom_id: goal.custom_id || '',
          title: goal.title || '(untitled)',
          owner: ownerOf(goal) || '—',
          own_health: health[goal.id],
          rollup_health: rolledHealth,
          rollup_progress: rolledProgress,
          descendants: kids.length,
          descendants_completed: kids.filter(isDone).length,
          descendants_off_track: offTrack.length,
          high_priority_off_track: highOffTrack.length,
        };
      });

    const priorities = Object.values(priorityMap).map((p) => ({
      ...p,
      completion_rate: p.total ? Math.round((p.completed / p.total) * 100) : 0,
    }));
    const topOwners = Object.entries(ownerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ owner: name, items: count }));
    const ownerRiskList = Object.entries(ownerRisk)
      .sort((a, b) => b[1].length - a[1].length)
      .slice(0, 15)
      .map(([owner, items]) => ({
        owner,
        at_risk_or_off_track: items.length,
        items: items.slice(0, 10),
      }));

    // ---- Performance measures (as at today) -----------------------------------
    const measureStats = blocks
      .filter((b) => b.level === MEASURE_LEVEL && b.tracking_config?.enabled)
      .map((b) => {
        const mv = measureValues[b.id] || {};
        const current = mv.current_value ?? null;
        const target = mv.target ?? null;
        const direction = b.tracking_config?.direction || 'Higher is Better';
        return {
          id: b.id,
          custom_id: b.custom_id || '',
          title: b.title || '(untitled)',
          owner: ownerOf(b) || '—',
          unit: b.tracking_config?.unit || '',
          direction,
          baseline: mv.baseline ?? null,
          current_value: current,
          target,
          gap: current !== null && target !== null ? Math.round((target - current) * 100) / 100 : null,
          // Direction-aware so it always reads "100% = at target", matching current_position.
          percent_of_target:
            current !== null && target
              ? Math.round(
                  (direction === 'Lower is Better' ? target / current : current / target) * 1000
                ) / 10
              : null,
          latest_period: mv.latest_period || '',
          current_position: positionOf(current, target, direction),
        };
      })
      .sort(
        (a, b) =>
          POSITION_RANK[a.current_position] - POSITION_RANK[b.current_position] ||
          String(a.title).localeCompare(String(b.title))
      );

    const measuresNoData = measureStats.filter((m) => m.current_position === 'no_data').length;

    const completed = blocks.filter(isDone).length;
    const metrics = {
      today,
      generated_label: clock.nowLabel,
      basis: 'point_in_time',
      strategy: {
        title: strategy.title || 'Untitled strategy',
        owner: strategy.owner || '—',
        status: strategy.status || '—',
        vision: strategy.vision || '',
        mission: strategy.mission || '',
        values: (strategy.values || []).map((v) => v.text).filter(Boolean),
      },
      overall: {
        total,
        completed,
        completion_rate: total ? Math.round((completed / total) * 100) : 0,
        avg_progress: total ? Math.round(progressSum / total) : 0,
        overdue: overdueList.length,
        due_next_30_days: due30,
        due_next_60_days: due60,
        at_risk: overallHealth['At Risk'] + overallHealth['Off Track'],
        at_risk_or_off_track: overallHealth['At Risk'] + overallHealth['Off Track'],
        health: overallHealth,
        status: overallStatus,
        missing_owner: missingOwner,
        missing_health: missingHealth,
        missing_due_date: missingDue,
        not_updated_60_days: staleList.length,
        orphans,
      },
      layers: layerStats,
      measures: measureStats,
      measures_summary: {
        tracked: measureStats.length,
        meeting: measureStats.filter((m) => m.current_position === 'meeting').length,
        near: measureStats.filter((m) => m.current_position === 'near').length,
        below: measureStats.filter((m) => m.current_position === 'below').length,
        no_data: measuresNoData,
      },
      priorities,
      top_owners: topOwners,
      owner_risk: ownerRiskList,
      goal_layer_name: goalLayerName,
      goal_rollups: goalRollups,
      overdue_list: overdueList.slice(0, 40),
      upcoming_list: upcomingList.slice(0, 40),
      stale_list: staleList.slice(0, 40),
      no_owner_list: noOwnerList.slice(0, 40),
      no_due_date_list: noDueDateList.slice(0, 40),
    };

    // ---- Bounded item-level detail for the model ------------------------------
    const itemDetail = blocks.slice(0, 250).map((b) => {
      const note = latestNote[b.id];
      const mv = measureValues[b.id];
      const row = {
        id: b.id,
        custom_id: b.custom_id || '',
        type: layerName(b),
        layer_key: layerByLevel[b.level]?.key || `level${b.level}`,
        title: b.title || '(untitled)',
        parent_id: b.parent_id || '',
        owner: ownerOf(b) || '',
        health: health[b.id],
        status: status[b.id],
        priority: b.priority || 'Not set',
        start_date: b.start_date || '',
        due_date: dueOf(b) || '',
        last_updated: lastUpdatedOf(b) || '',
        progress: progressOf(b),
        latest_update_note: note ? `${note.date}${note.title ? ` — ${note.title}` : ''}: ${note.text}` : '',
        orphan: isOrphan(b),
      };
      if (b.level === MEASURE_LEVEL) {
        row.baseline = mv?.baseline ?? null;
        row.current_value = mv?.current_value ?? null;
        row.target = mv?.target ?? null;
        row.unit = b.tracking_config?.unit || '';
        row.latest_reporting_period = mv?.latest_period || '';
        row.direction = b.tracking_config?.direction || 'Higher is Better';
        row.current_position = positionOf(mv?.current_value ?? null, mv?.target ?? null, row.direction);
      }
      return row;
    });

    const dataset = `precomputed_stats (authoritative — never recalculate or contradict these numbers):
${JSON.stringify(metrics, null, 1)}

ITEM DETAIL (${itemDetail.length} of ${blocks.length} items):
${itemDetail.length ? JSON.stringify(itemDetail, null, 1) : 'No strategic items recorded.'}`;

    const requested = config.sections
      .map((id) => sectionInstructions[id])
      .filter(Boolean)
      .map((line) => `- ${line}`)
      .join('\n');

    const prompt = `You are Strategy Analyst, an expert in strategic planning, performance management and programme evaluation. You write for boards, CEOs and executive teams.

Produce a STRATEGY STATUS REPORT for "${metrics.strategy.title}" as at ${today}.

Rules:
- This is a POINT IN TIME assessment. Assess only the current state of the items as at ${today}. Never assess or comment on progress relative to the strategy's start year, end year, time elapsed or time remaining, and never imply the plan is ahead of or behind a schedule derived from the strategy period.
- Every number, count, date and rate you cite MUST come from precomputed_stats below. Never compute, estimate or invent figures, and never contradict the supplied stats.
- overall.at_risk and overall.at_risk_or_off_track are the SAME combined figure (At Risk plus Off Track). Never report it as the count of At Risk items alone — for individual health counts use overall.health.
- Health values are exactly On Track, At Risk, Off Track or Not Set. Delivery status values are exactly Not Started, In Progress, Completed, On Hold, Cancelled or Not Set. Use these labels verbatim.
- "${goalLayerName}" roll-ups in goal_rollups are authoritative for goal-level progress and health — prefer them over an individual goal's own recorded values.
- The "measures" list in precomputed_stats is authoritative for performance measures: current_position (meeting / near / below / no_data), gap and percent_of_target are already calculated, direction-aware. Never recompute or re-judge a measure's position.
- Use ITEM DETAIL to name specific items, owners, measure values (baseline / current / target with unit) and the latest update note as evidence.
- Be constructive but never reassuring without evidence. Where the data is weak, stale or incomplete, say so plainly.
- Perform analytical checks: lagging layers, poor health concentration, overdue clusters, items not updated in 60+ days, unowned items, orphaned items with no line of sight, measures tracking below target, and mismatches between stated priority and actual progress.
- Write in plain professional English suitable for a board paper. No markdown headings.
${verbosity[config.length]}

Produce only these sections:
${requested}

${dataset}`;

    const narrative = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: schemaForSections(config.sections),
    });

    return Response.json({
      report: {
        strategy_id: strategyId,
        title: `Status Report — ${clock.nowLabel}`,
        generated_at: new Date().toISOString(),
        generated_by: user.id,
        generated_by_name: user.full_name || user.email || 'Unknown',
        sections: config.sections,
        length: config.length,
        metrics,
        narrative,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

serve(handler);
