// Conditional logic evaluation for membership form fields (custom fields only).
// A field with conditional_logic is only shown when its rule group passes against
// the current form answers.
//
// Shape (current): a group joining multiple rules with AND / OR.
//   {
//     match: 'AND' | 'OR',
//     conditions: [
//       { trigger_field_id, operator, value },
//       ...
//     ]
//   }
//
// Backward compatibility: older configs stored a single flat rule
//   { trigger_field_id, operator, value }
// which is treated as a one-condition AND group.

const norm = (v) => (v == null ? '' : String(v)).trim().toLowerCase();

// Normalise any stored conditional_logic into a group { match, conditions }.
function normalizeLogic(logic) {
  if (!logic) return null;
  // New group shape.
  if (Array.isArray(logic.conditions)) {
    return { match: logic.match === 'OR' ? 'OR' : 'AND', conditions: logic.conditions };
  }
  // Legacy single-rule shape.
  if (logic.trigger_field_id || logic.operator) {
    return { match: 'AND', conditions: [logic] };
  }
  return null;
}

// Evaluate a single rule against the current answers.
function evalRule(rule, answers) {
  if (!rule || !rule.trigger_field_id || !rule.operator) return true;

  const raw = answers[rule.trigger_field_id];
  const actual = Array.isArray(raw) ? raw.map(norm) : norm(raw);

  // Expected values as a normalised array (supports single or multi values).
  const expectedList = (Array.isArray(rule.value) ? rule.value : [rule.value]).map(norm).filter((v) => v !== '');
  if (expectedList.length === 0) return true;

  const matchesOne = (expected) =>
    Array.isArray(actual) ? actual.includes(expected) : actual === expected;
  const containsOne = (expected) =>
    Array.isArray(actual) ? actual.some((v) => v.includes(expected)) : actual.includes(expected);

  switch (rule.operator) {
    case 'equals':
      return expectedList.some(matchesOne);
    case 'not_equals':
      return !expectedList.some(matchesOne);
    case 'contains':
      return expectedList.some(containsOne);
    default:
      return true;
  }
}

// Evaluate a field's conditional_logic group.
// answers: map of field_id -> value (both system + custom values merged).
export function isFieldVisible(field, answers = {}) {
  const group = normalizeLogic(field?.conditional_logic);
  if (!group || group.conditions.length === 0) return true;

  const active = group.conditions.filter((c) => c && c.trigger_field_id && c.operator);
  if (active.length === 0) return true;

  return group.match === 'OR'
    ? active.some((rule) => evalRule(rule, answers))
    : active.every((rule) => evalRule(rule, answers));
}

// ── Plan-based field visibility ──────────────────────────────────────────────
// A field can be limited to specific membership plans via `visibility_plans`
// (array of MembershipStructure ids). Empty / missing = shown for all plans.

// Whether a field is visible given the plan the applicant has selected.
// selectedPlanId empty = no plan chosen yet: plan-restricted fields stay hidden,
// all-plan fields stay visible.
export function isFieldVisibleForPlan(field, selectedPlanId = '') {
  const plans = field?.visibility_plans;
  if (!Array.isArray(plans) || plans.length === 0) return true;
  return !!selectedPlanId && plans.includes(selectedPlanId);
}

// Whether a field is restricted to specific plans.
export function hasPlanVisibility(field) {
  return Array.isArray(field?.visibility_plans) && field.visibility_plans.length > 0;
}