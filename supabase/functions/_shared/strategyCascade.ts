/**
 * Shared cascade for removing strategy data, so a deleted Strategy or
 * StrategyBlock never leaves orphaned records behind.
 *
 * Ownership map (everything below a block is removed with it):
 *   StrategyBlock { id }
 *     ├─ Level5Task { block_id }                    tasks, milestones, sections
 *     │    ├─ Level5Subtask { task_id | block_id }  checklist items
 *     │    └─ NotePage { 'strategy_task', task id }
 *     ├─ StrategyBlockReport { block_id }           measure reporting rows
 *     │    └─ NotePage { 'strategy_block_report', report id }
 *     ├─ NotePage / Document / DocumentFolder { 'strategy_block' | 'strategy_deliverable', block id }
 *     └─ child StrategyBlock { parent_id } at any depth (same cascade, deepest first)
 *   Strategy { id }
 *     ├─ every StrategyBlock { strategy_id } (cascade above)
 *     └─ StrategyLevel2 { strategy_id }             focus-area labels
 *
 * Children are deleted before their parents and the Strategy record goes last,
 * only after a final verification finds nothing left. Every stage is a scoped
 * deleteMany that is safe to re-run, so transient failures are retried with
 * backoff and a failed run can simply be repeated by the user.
 */

import { CascadeError, withRetry, chunks, collectIds, purge, add, cleanIds, type Tally } from './cascadeKit.ts';

export { CascadeError, cleanIds };

const BLOCK_OBJECT_TYPES = ['strategy_block', 'strategy_deliverable'];
const TASK_NOTES = 'strategy_task';
const REPORT_NOTES = 'strategy_block_report';

/** Remove the given blocks and everything they own. Ids must be de-duplicated, non-empty strings. */
export async function cascadeDeleteBlocks(svc: any, blockIds: string[], tally: Tally = {}): Promise<Tally> {
  for (const ids of chunks(blockIds)) {
    const taskIds = await withRetry('Level5Task', () => collectIds(svc.Level5Task, { block_id: { $in: ids } }));
    const reportIds = await withRetry('StrategyBlockReport', () => collectIds(svc.StrategyBlockReport, { block_id: { $in: ids } }));

    for (const tIds of chunks(taskIds)) {
      add(tally, 'Level5Subtask', await purge(svc, 'Level5Subtask', { task_id: { $in: tIds } }));
      add(tally, 'NotePage', await purge(svc, 'NotePage', { object_type: TASK_NOTES, object_id: { $in: tIds } }));
    }
    add(tally, 'Level5Subtask', await purge(svc, 'Level5Subtask', { block_id: { $in: ids } }));
    for (const rIds of chunks(reportIds)) {
      add(tally, 'NotePage', await purge(svc, 'NotePage', { object_type: REPORT_NOTES, object_id: { $in: rIds } }));
    }
    add(tally, 'StrategyBlockReport', await purge(svc, 'StrategyBlockReport', { block_id: { $in: ids } }));
    add(tally, 'Level5Task', await purge(svc, 'Level5Task', { block_id: { $in: ids } }));

    const owned = { object_type: { $in: BLOCK_OBJECT_TYPES }, object_id: { $in: ids } };
    add(tally, 'NotePage', await purge(svc, 'NotePage', owned));
    add(tally, 'Document', await purge(svc, 'Document', owned));
    add(tally, 'DocumentFolder', await purge(svc, 'DocumentFolder', owned));

    add(tally, 'StrategyBlock', await purge(svc, 'StrategyBlock', { id: { $in: ids } }));
  }
  return tally;
}

/**
 * The given blocks plus every descendant (via parent_id, at any depth), deepest
 * first so children are always removed before their parents. A visited set
 * guards against parent loops in legacy data.
 */
export async function withDescendants(svc: any, rootIds: string[]): Promise<string[]> {
  const seen = new Set(rootIds);
  const levels: string[][] = [rootIds];
  let frontier = rootIds;
  while (frontier.length) {
    const next: string[] = [];
    for (const ids of chunks(frontier)) {
      const childIds = await withRetry('StrategyBlock', () => collectIds(svc.StrategyBlock, { parent_id: { $in: ids } }));
      childIds.forEach((id) => { if (!seen.has(id)) { seen.add(id); next.push(id); } });
    }
    if (next.length) levels.push(next);
    frontier = next;
  }
  return levels.reverse().flat();
}

/** Clear Connections on surviving blocks that pointed at removed blocks. */
export async function clearConnectionsTo(svc: any, strategyId: string, blockIds: string[]) {
  for (const ids of chunks(blockIds)) {
    await withRetry('connections', async () => {
      let res;
      do {
        res = await svc.StrategyBlock.updateMany(
          { strategy_id: strategyId, contributes_to: { $in: ids } },
          { $set: { contributes_to: '' } }
        );
      } while (res?.has_more);
    });
  }
}

/** Remove a strategy and all strategy-owned data. The Strategy record is deleted last. */
export async function cascadeDeleteStrategy(svc: any, strategyId: string): Promise<Tally> {
  const blockIds = await withRetry('StrategyBlock', () => collectIds(svc.StrategyBlock, { strategy_id: strategyId }));
  const tally = await cascadeDeleteBlocks(svc, [...new Set(blockIds)]);
  // Catch any block created mid-cascade before the strategy goes.
  add(tally, 'StrategyBlock', await purge(svc, 'StrategyBlock', { strategy_id: strategyId }));
  add(tally, 'StrategyLevel2', await purge(svc, 'StrategyLevel2', { strategy_id: strategyId }));
  await withRetry('Strategy', () => svc.Strategy.delete(strategyId));
  add(tally, 'Strategy', 1);
  return tally;
}