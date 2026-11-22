import { base44 } from '@/api/base44Client';
import { settleAllDeletes, deleteAllWhere } from '@/lib/cascadeDelete';

export const SKILL_LEVELS = [
  { value: 3, label: 'Strong Expertise', short: 'Strong' },
  { value: 2, label: 'Working Knowledge', short: 'Working' },
  { value: 1, label: 'Basic Understanding', short: 'Basic' },
];

/** Skill levels are 1-3 only. Anything outside the range is clamped, never persisted as-is. */
export function clampSkillLevel(level) {
  const n = Math.round(Number(level));
  if (!Number.isFinite(n)) return 2;
  return Math.min(3, Math.max(1, n));
}

export function levelLabel(level) {
  return SKILL_LEVELS.find((l) => l.value === Number(level))?.label || '—';
}

export const LEVEL_STYLES = {
  3: { bg: 'bg-green-100 dark:bg-green-400/15', text: 'text-green-700 dark:text-green-300' },
  2: { bg: 'bg-amber-100 dark:bg-amber-400/15', text: 'text-amber-700 dark:text-amber-300' },
  1: { bg: 'bg-muted', text: 'text-muted-foreground' },
};

// Internal seed list for ensureDefaultSkills — not part of the public API.
const DEFAULT_SKILLS = [
  'Finance',
  'Governance',
  'Accounting',
  'Risk Management',
  'Project Management',
  'Legal',
  'Marketing',
  'Technology',
];

// ---- BoardSkill CRUD ----
export async function listSkills() {
  return base44.entities.BoardSkill.list('order_index');
}

export async function createSkill(data) {
  return base44.entities.BoardSkill.create(data);
}

// Rename a skill and propagate the new name to all member assignments (cached skill_name).
// One batched updateMany rather than a per-record loop: fewer round trips, fewer failure points.
export async function renameSkill(id, newName) {
  await base44.entities.BoardSkill.update(id, { name: newName });
  await base44.entities.MemberSkill.updateMany({ skill_id: id }, { $set: { skill_name: newName } });
}

// Persist new ordering for a list of skills
export async function reorderSkills(orderedIds) {
  await Promise.all(orderedIds.map((id, i) => base44.entities.BoardSkill.update(id, { order_index: i })));
}

/**
 * Delete a skill and every member assignment referencing it.
 *
 * The assignments go first, in ONE guarded batched delete (same pattern as
 * deleteCategory) — if that fails the error bubbles and the skill itself is left
 * in place, so the user never ends up with assignments pointing at a skill that
 * no longer exists. Re-running converges: already-deleted rows match nothing.
 */
export async function deleteSkill(id) {
  await deleteAllWhere('MemberSkill', { skill_id: id });
  return base44.entities.BoardSkill.delete(id);
}

// Seed the default skill set once if the hub is empty.
// Guarded against the concurrent first-load race: two components mounting at the
// same time share one in-flight promise instead of each running list+bulkCreate
// and duplicating the whole default set. Cleared afterwards so a retry still works.
let skillsSeedInFlight = null;

export async function ensureDefaultSkills() {
  if (skillsSeedInFlight) return skillsSeedInFlight;
  skillsSeedInFlight = (async () => {
    const existing = await base44.entities.BoardSkill.list();
    if (existing.length > 0) return existing;
    return base44.entities.BoardSkill.bulkCreate(
      DEFAULT_SKILLS.map((name, i) => ({ name, is_required: true, order_index: i }))
    );
  })().finally(() => { skillsSeedInFlight = null; });
  return skillsSeedInFlight;
}

// ---- MemberSkill CRUD ----
export async function listMemberSkills() {
  return base44.entities.MemberSkill.list();
}

/**
 * Persist a person's skill assignments as a DIFF against what is already stored.
 *
 * Deliberately not delete-all-then-recreate: that pattern wipes every assignment
 * the moment the recreate step fails. Here only genuinely removed rows are
 * deleted, only new rows are created, and only changed levels are updated, so a
 * failure can never destroy assignments the user did not touch.
 *
 * skills: [{ skill_id, skill_name, level }]
 */
export async function setMemberSkills(personId, skills) {
  const existing = await base44.entities.MemberSkill.filter({ person_id: personId });
  const existingBySkill = new Map(existing.map((s) => [s.skill_id, s]));
  const desired = new Map();
  (skills || []).forEach((s) => {
    if (s?.skill_id) desired.set(s.skill_id, s);
  });

  const toCreate = [];
  const updates = [];
  desired.forEach((s, skillId) => {
    const level = clampSkillLevel(s.level);
    const row = existingBySkill.get(skillId);
    if (!row) {
      toCreate.push({ person_id: personId, skill_id: skillId, skill_name: s.skill_name, level });
    } else if (clampSkillLevel(row.level) !== level || row.skill_name !== s.skill_name) {
      updates.push(base44.entities.MemberSkill.update(row.id, { level, skill_name: s.skill_name }));
    }
  });
  const removals = existing
    .filter((row) => !desired.has(row.skill_id))
    .map((row) => base44.entities.MemberSkill.delete(row.id));

  // Additions first: if anything fails, the user's existing data is still intact.
  if (toCreate.length) await base44.entities.MemberSkill.bulkCreate(toCreate);
  if (updates.length) await settleAllDeletes(updates, 'skill assignments');
  if (removals.length) await settleAllDeletes(removals, 'skill assignments');
}