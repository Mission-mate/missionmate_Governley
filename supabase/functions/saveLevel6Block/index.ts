import { createClientFromRequest, serve } from '../_shared/base44.ts';

const METHODS = ['completion', 'count', 'both'];
const UNITS = ['#', '%', '$'];
const DIRECTIONS = ['Higher is Better', 'Lower is Better'];
// Reporting frequency is metadata only — never required. Unknown values are stored blank.
const FREQUENCIES = ['Monthly', 'Quarterly', 'Biannually', 'Annually', 'Every', 'Ad Hoc'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, strategy_id, data, level } = body || {};
    const blockLevel = Number(level) || 7;

    if (!data || typeof data !== 'object') {
      return Response.json({ error: 'Missing data' }, { status: 400 });
    }

    // Basic required fields
    if (!data.title || !String(data.title).trim()) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }
    const tc = data.tracking_config && typeof data.tracking_config === 'object' ? data.tracking_config : {};
    const tracking = {
      enabled: !!tc.enabled,
      method: METHODS.includes(tc.method) ? tc.method : '',
      unit: UNITS.includes(tc.unit) ? tc.unit : '#',
      direction: DIRECTIONS.includes(tc.direction) ? tc.direction : '',
    };
    const lastUpdated = data.last_updated || '';

    if (lastUpdated && lastUpdated > todayISO()) {
      return Response.json({ error: 'Last Updated date cannot be in the future' }, { status: 400 });
    }

    const frequency = FREQUENCIES.includes(data.reporting_frequency) ? data.reporting_frequency : '';

    const clean = {
      title: String(data.title).trim(),
      content: data.content || '',
      owner: data.owner || '',
      status: data.status || 'Not Started',
      health: data.health || '',
      priority: data.priority || '',
      tracking_config: tracking,
      reporting_frequency: frequency,
      reporting_interval_value: frequency === 'Every' ? Number(data.reporting_interval_value) || 1 : null,
      reporting_interval_unit: frequency === 'Every' ? (data.reporting_interval_unit === 'Years' ? 'Years' : 'Months') : '',
      reporting_period_start: data.reporting_period_start || '',
      last_updated: lastUpdated,
    };

    let saved;
    if (id) {
      saved = await base44.entities.StrategyBlock.update(id, clean);
    } else {
      if (!strategy_id) return Response.json({ error: 'Missing strategy_id' }, { status: 400 });
      saved = await base44.entities.StrategyBlock.create({ ...clean, strategy_id, level: blockLevel });
    }

    // Bump the parent Strategy's updated_date so the register/map cards reflect this edit.
    const parentStrategyId = strategy_id || saved.strategy_id;
    if (parentStrategyId) {
      try {
        await base44.entities.Strategy.update(parentStrategyId, { updated_date: new Date().toISOString() });
      } catch (_e) { /* non-fatal */ }
    }

    return Response.json({ block: saved });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});