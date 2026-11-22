/**
 * Shared configuration for the AI Strategy Status Report.
 *
 * Holds the selectable section catalogue, the verbosity presets, the response
 * schema builder and a server-side copy of the strategy hierarchy layer
 * defaults (backend functions cannot import from src/).
 */

/** Every section the user can select, mapped to the narrative fields it produces. */
export const sectionFields = {
  executive_summary: ['executive_summary', 'status_statement'],
  overall_status: ['overall_status', 'overall_rating'],
  level_breakdown: ['level_breakdown'],
  health_analysis: ['health_analysis'],
  delivery_status: ['delivery_status'],
  progress_analysis: ['progress_analysis'],
  performance_measures: ['performance_measures'],
  overdue_items: ['overdue_analysis'],
  upcoming_milestones: ['upcoming_milestones'],
  priority_analysis: ['priority_analysis'],
  ownership_accountability: ['ownership_accountability'],
  contribution_alignment: ['contribution_alignment'],
  data_quality: ['data_quality_findings'],
  gaps: ['gaps'],
  opportunities: ['opportunities'],
  risks_and_blockers: ['risks_and_blockers'],
  recommendations: ['recommendations'],
  outlook: ['outlook'],
};

export const ALL_SECTIONS = Object.keys(sectionFields);

/** What the model is asked to write for each selected section. */
export const sectionInstructions = {
  executive_summary:
    'executive_summary: a board-level narrative of where the strategy stands, citing real figures from precomputed_stats; status_statement: one strong, evidence-based sentence on the strategy\'s trajectory.',
  overall_status:
    'overall_status: state where the strategy stands right now, reading only the current health, delivery status, completion and overdue position of the items as recorded today; overall_rating: one of on_track, at_risk or off_track, justified by the stats.',
  level_breakdown:
    'level_breakdown: one entry per hierarchy layer present in precomputed_stats, each with the layer label, a short assessment and a status of on_track, at_risk or off_track.',
  health_analysis:
    'health_analysis: analyse the health mix (On Track / At Risk / Off Track / Not Set) and what the concentration of poor health means.',
  delivery_status:
    'delivery_status: analyse the delivery status mix (Not Started, In Progress, Completed, On Hold, Cancelled) and what it says about execution.',
  progress_analysis:
    'progress_analysis: analyse completion rates and average progress across layers, calling out lagging and leading layers.',
  performance_measures:
    'performance_measures: analyse the performance measures using the supplied measures list — name measures sitting below target (largest gaps first), measures with no reported value, and those meeting target, always citing current value, target and gap with the measure\'s unit and respecting whether higher or lower is better.',
  overdue_items:
    'overdue_analysis: analyse overdue items using the supplied overdue list, naming the most material items and the accountability implications.',
  upcoming_milestones:
    'upcoming_milestones: analyse what falls due in the next 30 and 60 days and where delivery pressure sits.',
  priority_analysis:
    'priority_analysis: analyse performance by priority band (High/Medium/Low) and whether effort matches stated priority.',
  ownership_accountability:
    'ownership_accountability: analyse owner coverage, unassigned items and accountability concentration.',
  contribution_alignment:
    'contribution_alignment: analyse how well items link up the hierarchy (orphans / unlinked items) and what that means for line of sight from delivery to vision.',
  data_quality:
    'data_quality_findings: findings on data completeness, each with title, detail and a severity of info, warning or critical. Cover missing owners, missing health, missing due dates and unlinked items, and always include a finding for items not updated in 60+ days (use stale_list) and a finding for measures with no reported current value (use the measures list) whenever either is present.',
  gaps: 'gaps: concrete gaps evidenced by the data.',
  opportunities: 'opportunities: strategic opportunities to accelerate or strengthen delivery.',
  risks_and_blockers:
    'risks_and_blockers: delivery risks and blockers, each with title, detail and a severity of info, warning or critical.',
  recommendations: 'recommendations: prioritised, concrete next steps for the board and executive.',
  outlook: 'outlook: what warrants attention next from where the strategy stands today — watch items, emerging pressure points and what could deteriorate if unaddressed. Never frame this against time remaining, the plan end date or the strategy period.',
};

/** Canonical health labels. Everything else normalises into 'Not Set'. */
export const HEALTH_LABELS = ['On Track', 'At Risk', 'Off Track', 'Not Set'];

/** Canonical delivery status labels. Everything else normalises into 'Not Set'. */
export const STATUS_LABELS = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled', 'Not Set'];

/** Collapse a stored value to a comparison key: lowercase, no spaces/underscores/dashes. */
const slug = (v) => String(v ?? '').trim().toLowerCase().replace(/[\s_\-]+/g, '');

const HEALTH_MAP = {
  ontrack: 'On Track',
  atrisk: 'At Risk',
  monitor: 'At Risk', // legacy value, retained in older records
  offtrack: 'Off Track',
};

const STATUS_MAP = {
  notstarted: 'Not Started',
  inprogress: 'In Progress',
  completed: 'Completed',
  complete: 'Completed',
  onhold: 'On Hold',
  cancelled: 'Cancelled',
  canceled: 'Cancelled',
};

export function normaliseHealth(value) {
  return HEALTH_MAP[slug(value)] || 'Not Set';
}

export function normaliseStatus(value) {
  return STATUS_MAP[slug(value)] || 'Not Set';
}

export const blankHealthCounts = () => HEALTH_LABELS.reduce((a, k) => ({ ...a, [k]: 0 }), {});
export const blankStatusCounts = () => STATUS_LABELS.reduce((a, k) => ({ ...a, [k]: 0 }), {});

/** Plain text from stored rich-text HTML, collapsed and bounded. */
export function stripHtml(html, max = 400) {
  const text = String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

export const verbosity = {
  concise:
    'Use terse, decision-focused prose. Keep each narrative section to one short paragraph and lists to no more than 3 items.',
  standard:
    'Use tight board-level prose focused on implications, decisions and accountability. Keep each section concise but substantive, with 3-4 list items.',
  detailed:
    'Provide full analysis with evidence, named items and material figures. Use 2-3 paragraphs where useful and 4-6 list items.',
};

/** Clamp the request body to a valid section list + length. */
export function normaliseConfig(body) {
  const length = ['concise', 'standard', 'detailed'].includes(body?.length) ? body.length : 'standard';
  const requested = Array.isArray(body?.sections) ? body.sections : ALL_SECTIONS;
  const sections = requested.filter((id) => ALL_SECTIONS.includes(id));
  return { length, sections: sections.length ? sections : ALL_SECTIONS };
}

const SEVERITY_ITEM = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    detail: { type: 'string' },
    severity: { type: 'string', enum: ['info', 'warning', 'critical'] },
  },
};

/** Build a response_json_schema containing only the fields the user asked for. */
export function schemaForSections(sections) {
  const properties = {};
  const fields = new Set(sections.flatMap((id) => sectionFields[id] || []));
  fields.forEach((field) => {
    if (field === 'level_breakdown') {
      properties[field] = {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            assessment: { type: 'string' },
            status: { type: 'string', enum: ['on_track', 'at_risk', 'off_track'] },
          },
        },
      };
    } else if (field === 'data_quality_findings' || field === 'risks_and_blockers') {
      properties[field] = { type: 'array', items: SEVERITY_ITEM };
    } else if (field === 'gaps' || field === 'opportunities' || field === 'recommendations') {
      properties[field] = { type: 'array', items: { type: 'string' } };
    } else if (field === 'overall_rating') {
      properties[field] = { type: 'string', enum: ['on_track', 'at_risk', 'off_track'] };
    } else {
      properties[field] = { type: 'string' };
    }
  });
  return { type: 'object', properties };
}

/**
 * Server-side mirror of the built-in hierarchy layers (see src/lib/strategyLayers.js).
 * Only what the report needs: storage slot, default name and rename capability.
 */
const BASE_LAYERS = [
  { key: 'vision', level: 1, name: 'Vision', canRename: false, canDisable: false },
  { key: 'theme', level: 2, name: 'Focus Areas', canRename: true, canDisable: true },
  { key: 'priorities', level: 3, name: 'Priorities', canRename: true, canDisable: false },
  { key: 'actions', level: 5, name: 'Actions', canRename: true, canDisable: false },
  { key: 'initiatives', level: 6, name: 'Projects', canRename: true, canDisable: true },
  { key: 'measures', level: 7, name: 'Measures', canRename: true, canDisable: true },
  { key: 'enablers', level: 8, name: 'Enablers', canRename: true, canDisable: true },
  { key: 'custom', level: 9, name: 'Custom', canRename: true, canDisable: true },
];

const DEFAULT_DISABLED = new Set(['custom']);

/**
 * Numeric storage slot (StrategyBlock.level) of a built-in layer, by stable key.
 * Slots are identifiers only — never compare them to infer hierarchy order.
 */
export const layerSlot = (key) => BASE_LAYERS.find((l) => l.key === key)?.level;

const storedLayers = (strategy) =>
  Array.isArray(strategy?.strategy_layers) ? strategy.strategy_layers : [];

/** Turn stored layer records into the ordered, enabled layers. */
function hydrateStored(stored) {
  const layers = [];
  for (const entry of stored) {
    const key = entry?.key;
    const def = BASE_LAYERS.find((l) => l.key === key);
    if (!def || layers.some((l) => l.key === key)) continue;
    const enabled = def.canDisable ? entry.enabled !== false : true;
    if (!enabled) continue;
    const name = typeof entry.name === 'string' ? entry.name.trim() : '';
    layers.push({ ...def, name: def.canRename ? name || def.name : def.name });
  }
  // Mandatory layers can never be lost from the hierarchy.
  BASE_LAYERS.forEach((def) => {
    if (!def.canDisable && !layers.some((l) => l.key === def.key)) layers.push(def);
  });
  return layers;
}

/** Resolve the ordered, enabled layers for a strategy, using the built-in defaults when nothing is stored. */
export function resolveLayers(strategy) {
  const stored = storedLayers(strategy);
  if (!stored.length) return BASE_LAYERS.filter((l) => !DEFAULT_DISABLED.has(l.key));
  return hydrateStored(stored);
}