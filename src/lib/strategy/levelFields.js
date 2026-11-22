import { format, parseISO } from 'date-fns';
import { base44 } from '@/api/base44Client';
import { updateStrategy } from '@/lib/strategy';
import { getEnabledLayers, LEVELS } from '@/lib/strategyLayers';
import { toCustomColumns } from '@/lib/configNormalize';

/**
 * Per-strategy, per-level field configuration for the Strategy Customiser.
 *
 * Stored on the Strategy as `level_field_config`, keyed `level{n}`:
 *   { priority_visible: boolean, custom: [{ id, title, type, config }] }
 *
 * Priority is a locked system field — its High/Medium/Low options can never be
 * edited, only shown or hidden. The Priorities layer has no Priority field at all.
 */

/** Column types offered by the Strategy Customiser (narrower than the register library). */
export const STRATEGY_COLUMN_TYPES = ['Single Select', 'Date', 'People', 'Text/Number', 'Progress'];

/** Storage slots of the layers without a Priority field at all. */
const NO_PRIORITY_LEVELS = [LEVELS.PRIORITIES];

export function levelHasPriority(level) {
  return !NO_PRIORITY_LEVELS.includes(Number(level));
}

const TRACK_OPTIONS = [
  { name: 'On Track', color: 'green' },
  { name: 'At Risk', color: 'orange' },
  { name: 'Off Track', color: 'red' },
];

/**
 * Optional system fields of the Programs (initiatives) layer. Hidden until ticked
 * in the Customiser; their options can be renamed and recoloured but never added
 * to or removed. Values live in the block's custom_fields under the field id.
 */
export const SYSTEM_FIELDS = [
  { id: 'sys_schedule', title: 'Schedule', tooltip: 'Is the project delivering its milestones on time?', options: TRACK_OPTIONS },
  { id: 'sys_resource', title: 'Resource', tooltip: 'Does the project have the people, skills and time it needs?', options: TRACK_OPTIONS },
  { id: 'sys_budget', title: 'Budget', tooltip: 'Is spending in line with the approved budget?', options: TRACK_OPTIONS },
  {
    id: 'sys_risk',
    title: 'Risk',
    tooltip: 'How worried should we be about this project’s risk exposure?',
    options: [{ name: 'High', color: 'red' }, { name: 'Medium', color: 'orange' }, { name: 'Low', color: 'green' }],
  },
];

/** System fields offered on a level — only the Programs layer has any. */
export function levelSystemFields(level) {
  return Number(level) === LEVELS.INITIATIVES ? SYSTEM_FIELDS : [];
}

/** One system field's settings, safe to use: blank or duplicate option names fall back to the defaults. */
function readSystemField(def, stored) {
  const options = def.options.map((d, i) => {
    const o = stored?.options?.[i];
    const name = typeof o?.name === 'string' ? o.name.trim() : '';
    return { name: name || d.name, color: o?.color || d.color };
  });
  const unique = new Set(options.map((o) => o.name.toLowerCase())).size === options.length;
  return {
    table_visible: stored?.table_visible === true,
    options: unique ? options : options.map((o, i) => ({ ...o, name: def.options[i].name })),
  };
}

/** A level's config with its system fields cleaned, keyed by field id beside `priority_visible` and `custom`. */
export function normalizeLevelFieldConfig(level, cfg) {
  const system = Object.fromEntries(levelSystemFields(level).map((def) => [def.id, readSystemField(def, cfg?.[def.id])]));
  return { ...cfg, ...system };
}

/** Resolved config for one level — always safe to read from. */
export function getLevelFieldConfig(strategy, level) {
  const all = strategy?.level_field_config;
  const entry = all && typeof all === 'object' ? all[`level${level}`] : null;
  return normalizeLevelFieldConfig(level, {
    priority_visible: entry?.priority_visible !== false,
    custom: toCustomColumns(entry?.custom),
    ...(entry?.system && typeof entry.system === 'object' ? entry.system : {}),
  });
}

/** Ticked system fields as Single Select columns, so tables, filters, exports and forms treat them like custom columns. */
function getSystemColumns(strategy, level) {
  const cfg = getLevelFieldConfig(strategy, level);
  return levelSystemFields(level)
    .filter((def) => cfg[def.id].table_visible)
    .map((def) => ({
      id: def.id,
      title: def.title,
      tooltip: def.tooltip,
      type: 'Single Select',
      table_visible: true,
      config: { options: cfg[def.id].options },
    }));
}

/** Editable columns for a level: its ticked system fields, then its custom columns (never undefined). */
export function getCustomColumns(strategy, level) {
  return [...getSystemColumns(strategy, level), ...getLevelFieldConfig(strategy, level).custom];
}

/** Custom columns switched on for table display (hidden by default). */
export function getTableCustomColumns(strategy, level) {
  return getCustomColumns(strategy, level).filter((c) => c.table_visible === true);
}

/** Whether the Priority column should render in this level's table. */
export function showPriority(strategy, level) {
  return levelHasPriority(level) && getLevelFieldConfig(strategy, level).priority_visible;
}

/**
 * Whether the Overview tab should show a Priority column at all — true only when
 * at least one enabled table layer still has Priority switched on.
 */
export function overviewShowsPriority(strategy) {
  return getEnabledLayers(strategy).some(
    (l) => l.module !== 'overview' && levelHasPriority(l.level) && showPriority(strategy, l.level)
  );
}

export async function saveLevelFieldConfig(strategy, level, cfg) {
  const all =
    strategy?.level_field_config && typeof strategy.level_field_config === 'object'
      ? { ...strategy.level_field_config }
      : {};
  all[`level${level}`] = {
    priority_visible: cfg.priority_visible !== false,
    custom: (cfg.custom || []).map((c) => ({
      id: c.id, title: c.title, type: c.type,
      ...(c.table_visible ? { table_visible: true } : {}),
      config: c.config || {},
    })),
  };
  const systemFields = levelSystemFields(level);
  if (systemFields.length) {
    const clean = normalizeLevelFieldConfig(level, cfg);
    all[`level${level}`].system = Object.fromEntries(systemFields.map((def) => [def.id, clean[def.id]]));
  }
  return updateStrategy(strategy.id, { level_field_config: all });
}

export function newColumnId() {
  return `col_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

/** Read a custom column's value off a block. */
export function customValue(block, columnId) {
  const map = block?.custom_fields;
  return map && typeof map === 'object' ? map[columnId] : undefined;
}

/**
 * Plain-text rendering of a custom value — the single source of truth for
 * search, group, filter and export so every surface shows the same label.
 * Empty values always resolve to '' (never 'undefined' / 'null').
 */
export function customValueText(column, value) {
  if (value === undefined || value === null || value === '') return '';
  if (Array.isArray(value)) return value.filter(Boolean).join(', ');
  if (column?.type === 'Progress') {
    const n = Number(value);
    return Number.isFinite(n) ? `${Math.max(0, Math.min(100, n))}%` : '';
  }
  if (column?.type === 'Date') {
    try { return format(parseISO(String(value)), 'MMM d, yyyy'); } catch { return String(value); }
  }
  return String(value);
}

/** Prefix marking a toolbar field as a custom column rather than a block property. */
export const CUSTOM_FIELD_PREFIX = 'custom:';

/**
 * Synthetic toolbar field entries for a level's custom columns, so Group /
 * Filter / Export can treat them alongside the built-in block fields.
 */
export function customFieldEntries(customCols = []) {
  return customCols.map((column) => ({
    key: `${CUSTOM_FIELD_PREFIX}${column.id}`,
    label: column.title,
    custom: true,
    column,
  }));
}

/**
 * Fields the dirty guard compares: priority visibility plus each custom column's
 * id, title, type and options as name|colour. Other config keys and option ids
 * are deliberately ignored.
 */
export function fieldConfigSnapshot(cfg) {
  return {
    priority_visible: cfg?.priority_visible !== false,
    custom: (cfg?.custom || []).map((c) => ({
      id: c.id,
      title: c.title || '',
      type: c.type || '',
      options: (c.config?.options || []).map((o) => `${o.name}|${o.color}`),
    })),
    system: SYSTEM_FIELDS.filter((def) => cfg?.[def.id]).map((def) => ({
      id: def.id,
      visible: cfg[def.id].table_visible,
      options: cfg[def.id].options.map((o) => `${o.name}|${o.color}`),
    })),
  };
}

/**
 * Which stored custom_fields keys are orphaned by a config change:
 * columns that no longer exist, plus Single Select values that are no longer
 * a valid option on their column.
 */
export function computeCustomFieldCleanup(prevCfg, nextCfg) {
  const prev = prevCfg?.custom || [];
  const next = nextCfg?.custom || [];
  const nextIds = new Set(next.map((c) => c.id));
  return {
    removedIds: prev.filter((c) => !nextIds.has(c.id)).map((c) => c.id),
    optionScrub: next
      .filter((c) => c.type === 'Single Select')
      .map((c) => ({ id: c.id, allowed: (c.config?.options || []).map((o) => o.name) })),
    // Renamed system field options: stored values follow the option to its new name.
    renames: SYSTEM_FIELDS.filter((def) => prevCfg?.[def.id] && nextCfg?.[def.id])
      .map((def) => ({
        id: def.id,
        names: Object.fromEntries(
          prevCfg[def.id].options
            .map((o, i) => [o.name, nextCfg[def.id].options[i].name])
            .filter(([from, to]) => from !== to)
        ),
      }))
      .filter((r) => Object.keys(r.names).length),
  };
}

/**
 * Scrubs orphaned custom_fields values from every block at this strategy+level.
 * Runs before the new config is saved so a deleted column never leaves its
 * values stranded in the database.
 */
export async function cleanupCustomFieldData(strategyId, level, prevCfg, nextCfg) {
  const { removedIds, optionScrub, renames } = computeCustomFieldCleanup(prevCfg, nextCfg);
  if (!removedIds.length && !optionScrub.length && !renames.length) return 0;

  const blocks = await base44.entities.StrategyBlock.filter({
    strategy_id: strategyId,
    level: Number(level),
  });

  const updates = [];
  blocks.forEach((b) => {
    const map = b.custom_fields;
    if (!map || typeof map !== 'object') return;
    const nextMap = { ...map };
    let changed = false;

    removedIds.forEach((id) => {
      if (id in nextMap) { delete nextMap[id]; changed = true; }
    });
    optionScrub.forEach(({ id, allowed }) => {
      const v = nextMap[id];
      if (v === undefined || v === null || v === '') return;
      if (!allowed.includes(String(v))) { delete nextMap[id]; changed = true; }
    });
    renames.forEach(({ id, names }) => {
      const to = names[nextMap[id]];
      if (to) { nextMap[id] = to; changed = true; }
    });

    if (changed) updates.push({ id: b.id, custom_fields: nextMap });
  });

  for (let i = 0; i < updates.length; i += 500) {
    await base44.entities.StrategyBlock.bulkUpdate(updates.slice(i, i + 500));
  }
  return updates.length;
}