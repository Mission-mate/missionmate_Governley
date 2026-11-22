import { base44 } from '@/api/base44Client';
import { deleteAllWhere, settleAllDeletes } from '@/lib/cascadeDelete';
import { deleteTaskWorkspace } from '@/lib/obligationTasks';

// Board Decisions Registers: records kept separate from Action Registers.
export function listDecisionRegisters() {
  return base44.entities.DecisionRegister.list('-created_date');
}

export function getDecisionRegister(id) {
  return base44.entities.DecisionRegister.get(id);
}

export function createDecisionRegister({ title, description, status }) {
  return base44.entities.DecisionRegister.create({ title, description, status });
}

export function updateDecisionRegister(id, { title, description, status }) {
  return base44.entities.DecisionRegister.update(id, { title, description, status });
}

/** Delete a register with its decisions and everything attached to them. */
export async function deleteDecisionRegister(id) {
  const decisions = await base44.entities.Decision.filter({ register_id: id });
  if (decisions.length > 0) {
    await settleAllDeletes(
      decisions.map((d) => deleteDecisionDependents(d.id)),
      'decision checklists, notes and documents'
    );
    await deleteAllWhere('Decision', { register_id: id });
  }
  return base44.entities.DecisionRegister.delete(id);
}

// ── Decisions ─────────────────────────────────────────────────────────────────
export function listDecisions(registerId) {
  return base44.entities.Decision.filter({ register_id: registerId }, '-created_date');
}

export function createDecision(registerId, data) {
  return base44.entities.Decision.create({ register_id: registerId, ...data });
}

export function updateDecision(id, data) {
  return base44.entities.Decision.update(id, data);
}

/** Remove a decision's checklist, note pages, documents and folders. */
function deleteDecisionDependents(id) {
  const scope = { object_type: 'decision', object_id: id };
  return settleAllDeletes([
    deleteTaskWorkspace('decision', id),
    deleteAllWhere('NotePage', scope),
    deleteAllWhere('Document', scope),
    deleteAllWhere('DocumentFolder', scope),
  ], 'decision checklists, notes and documents');
}

/** Delete a decision, clearing its dependents first so nothing is orphaned.
 *  Decisions that replaced it lose the link to it, never the decision itself. */
export async function deleteDecision(id) {
  await deleteDecisionDependents(id);
  let more = true;
  while (more) {
    const res = await base44.entities.Decision.updateMany(
      { earlier_decision_id: id },
      { $set: { earlier_decision_id: '' } }
    );
    more = res?.has_more === true;
  }
  return base44.entities.Decision.delete(id);
}