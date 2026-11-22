import { base44 } from '@/api/base44Client';
import { getLayerByLevel } from '@/lib/strategyLayers';

/** Page subtitles keyed by the layer's stable key. */
export const LAYER_SUBTITLES = {
  overview: 'Manage and track strategic objectives and initiatives in one central workspace',
  priorities: 'Manage and track strategic objectives and initiatives in one central workspace',
  actions: 'Track the actions, milestones, responsibilities, and due dates required to deliver initiatives',
  initiatives: 'Deliver projects through tasks and milestones, and track their progress',
  measures: 'Create a measure to monitor the performance, output, outcome, or impact of initiatives',
  enablers: 'Manage foundational capabilities, resources, and infrastructure required to execute the strategy',
  custom: 'Track the actions, milestones, responsibilities, and due dates required to deliver initiatives',
};

/**
 * Resolve the user-facing name of the layer stored at a numeric storage slot.
 * The number is only ever a lookup key into the strategy's layers — it carries
 * no meaning of its own, so an unknown slot has no name.
 */
export function levelLabel(strategy, level) {
  return getLayerByLevel(strategy, level)?.name || '';
}

/** A storage slot is enabled when its layer exists in the hierarchy and is switched on. */
export function levelEnabled(strategy, level) {
  return getLayerByLevel(strategy, level)?.enabled === true;
}

export function listStrategies() {
  return base44.entities.Strategy.list('-updated_date');
}

export function getStrategy(id) {
  return base44.entities.Strategy.get(id);
}

export function createStrategy(data) {
  return base44.entities.Strategy.create(data);
}

export function updateStrategy(id, data) {
  return base44.entities.Strategy.update(id, data);
}

/** Invoke a server-side cascade, surfacing its error message instead of a generic request failure. */
async function runCascade(name, payload) {
  try {
    return await base44.functions.invoke(name, payload);
  } catch (e) {
    throw new Error(e?.response?.data?.error || e.message);
  }
}

/**
 * Delete a strategy and all strategy-owned data. The server retries transient
 * failures and deletes the Strategy record last, so on failure the strategy
 * remains and the delete can be retried safely.
 */
export function deleteStrategy(id) {
  return runCascade('deleteStrategy', { strategy_id: id });
}

export function listBlocks(strategyId) {
  return base44.entities.StrategyBlock.filter({ strategy_id: strategyId }, 'order_index');
}

/**
 * Bump the parent Strategy's updated_date so the Strategy Register cards
 * reflect the latest edit made to any of its blocks. Fire-and-forget: never
 * block or fail the block operation on a touch error.
 */
export function touchStrategy(strategyId) {
  if (!strategyId) return Promise.resolve();
  return base44.entities.Strategy.update(strategyId, { updated_date: new Date().toISOString() }).catch(() => {});
}

export async function createBlock(data) {
  const block = await base44.entities.StrategyBlock.create(data);
  await touchStrategy(data.strategy_id || block.strategy_id);
  return block;
}

export async function updateBlock(id, data) {
  const block = await base44.entities.StrategyBlock.update(id, data);
  await touchStrategy(data.strategy_id || block.strategy_id);
  return block;
}

/**
 * Delete blocks with everything they own (tasks, subtasks, reports, notes,
 * documents) and clear Connections that pointed at them. Already-removed ids
 * are treated as done, so a failed delete can simply be retried.
 */
export async function deleteBlocks(ids) {
  const { data } = await runCascade('deleteStrategyBlocks', { block_ids: ids });
  await Promise.all((data.strategy_ids || []).map(touchStrategy));
  return data;
}

export function deleteBlock(id) {
  return deleteBlocks([id]);
}

/** Persist a new row order for a set of blocks by writing sequential order_index values. */
export async function reorderBlocks(orderedBlocks) {
  const res = await base44.entities.StrategyBlock.bulkUpdate(
    orderedBlocks.map((b, i) => ({ id: b.id, order_index: i }))
  );
  await touchStrategy(orderedBlocks[0]?.strategy_id);
  return res;
}