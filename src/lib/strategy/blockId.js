import { base44 } from '@/api/base44Client';

/** "Measures" → "Measure ID" — follows the level name configured by the user. */
export function blockIdLabel(levelName = '') {
  const n = (levelName || '').trim();
  const singular = n.endsWith('ies') ? `${n.slice(0, -3)}y` : n.endsWith('s') ? n.slice(0, -1) : n;
  return `${singular || 'Record'} ID`;
}

const prefixOf = (levelName = '') =>
  ((levelName || '').replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'REC').toUpperCase();

/** Next sequential ID for a level within a strategy, e.g. MEA-004. */
export function nextBlockId(blocks, level, levelName) {
  const prefix = prefixOf(levelName);
  const used = blocks.filter((b) => Number(b.level) === Number(level)).map((b) => b.custom_id || '');
  const pad = (i) => `${prefix}-${String(i).padStart(3, '0')}`;
  let n = used.length + 1;
  while (used.includes(pad(n))) n += 1;
  return pad(n);
}

/** True when another block in the same strategy already uses this ID. */
export async function isBlockIdTaken(strategyId, customId, excludeBlockId) {
  const id = (customId || '').trim();
  if (!id || !strategyId) return false;
  const matches = await base44.entities.StrategyBlock.filter({ strategy_id: strategyId, custom_id: id });
  return matches.some((b) => b.id !== excludeBlockId);
}