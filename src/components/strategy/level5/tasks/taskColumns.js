/** Built-in column definitions + config helpers for the Level 5 task table. */

// System columns are always visible and cannot be hidden or deleted (only reorderable/renamable).
export const SYSTEM_TASK_KEYS = ['owner', 'health', 'start_date', 'due_date', 'status', 'priority', 'progress'];

export const BUILTIN_TASK_COLUMNS = [
  {
    key: 'health', label: 'Health', type: 'Single Select',
    options: [
      { name: 'On Track', color: 'green' },
      { name: 'At Risk', color: 'orange' },
      { name: 'Off Track', color: 'red' },
    ],
  },
  { key: 'owner', label: 'Owner', type: 'People' },
  { key: 'start_date', label: 'Start Date', type: 'Date' },
  { key: 'due_date', label: 'Due Date', type: 'Date' },
  {
    key: 'status', label: 'Status', type: 'Single Select',
    options: [
      { name: 'Not Started', color: 'gray' },
      { name: 'In Progress', color: 'blue' },
      { name: 'Completed', color: 'green' },
      { name: 'On Hold', color: 'orange' },
      { name: 'Cancelled', color: 'red' },
    ],
  },
  {
    key: 'priority', label: 'Priority', type: 'Single Select', hideable: true,
    options: [
      { name: 'High', color: 'red' },
      { name: 'Medium', color: 'orange' },
      { name: 'Low', color: 'green' },
    ],
  },
  {
    key: 'effectiveness', label: 'Effectiveness', type: 'Single Select',
    options: [
      { name: 'Effective', color: 'green' },
      { name: 'Partially Effective', color: 'orange' },
      { name: 'Ineffective', color: 'red' },
      { name: 'Not Assessed', color: 'purple' },
    ],
  },
  { key: 'progress', label: 'Progress %', type: 'Progress' },
];

/** System columns the user may hide (visible by default). */
export const HIDEABLE_TASK_KEYS = BUILTIN_TASK_COLUMNS.filter((c) => c.hideable).map((c) => c.key);

/** Optional column pinned to the end of the list — cannot be reordered. */
export const PINNED_LAST_TASK_KEY = 'progress';

/** Optional columns hidden by default until the user ticks them in Manage Columns. */
export const DEFAULT_HIDDEN_TASK_KEYS = ['effectiveness'];

export function normalizeTaskColumns(tc) {
  const src = tc && typeof tc === 'object' ? tc : {};
  const keys = BUILTIN_TASK_COLUMNS.map((c) => c.key);
  const stored = Array.isArray(src.optional_order) ? src.optional_order.filter((k) => keys.includes(k)) : [];
  const isOptional = (k) => !SYSTEM_TASK_KEYS.includes(k);
  const optionalOrdered = stored.filter(isOptional);
  const missing = keys.filter((k) => isOptional(k) && !optionalOrdered.includes(k));
  // System columns lead in their fixed order; Progress % is always pinned to the very end.
  const fullOrder = [
    ...SYSTEM_TASK_KEYS.filter((k) => k !== PINNED_LAST_TASK_KEY),
    ...optionalOrdered,
    ...missing,
    PINNED_LAST_TASK_KEY,
  ];
  // System columns are always visible; only non-system columns can be toggled.
  const storedVisible = Array.isArray(src.optional_visible)
    ? src.optional_visible.filter((k) => keys.includes(k) && isOptional(k))
    : keys.filter((k) => isOptional(k) && !DEFAULT_HIDDEN_TASK_KEYS.includes(k));
  const visible = fullOrder.filter((k) => SYSTEM_TASK_KEYS.includes(k) || storedVisible.includes(k));
  return {
    optional_visible: visible,
    optional_order: fullOrder,
    optional_labels: src.optional_labels && typeof src.optional_labels === 'object' ? src.optional_labels : {},
    optional_options: src.optional_options && typeof src.optional_options === 'object' ? src.optional_options : {},
    system_hidden: Array.isArray(src.system_hidden) ? src.system_hidden.filter((k) => HIDEABLE_TASK_KEYS.includes(k)) : [],
    custom: Array.isArray(src.custom) ? src.custom : [],
  };
}

/** Whether a system column is shown — only hideable ones (Priority) can be hidden. */
export function isSystemVisible(config, key) {
  return !HIDEABLE_TASK_KEYS.includes(key) || !(config.system_hidden || []).includes(key);
}

/** Ordered keys of every built-in column currently shown in the table. */
export function visibleBuiltinKeys(config) {
  return config.optional_order.filter((k) =>
    SYSTEM_TASK_KEYS.includes(k) ? isSystemVisible(config, k) : config.optional_visible.includes(k)
  );
}

/** Effective built-in column (label + options with per-block overrides applied). */
export function builtinColumn(config, key) {
  const def = BUILTIN_TASK_COLUMNS.find((c) => c.key === key);
  if (!def) return null;
  return {
    kind: 'builtin',
    key,
    type: def.type,
    label: config.optional_labels?.[key] || def.label,
    options: config.optional_options?.[key] || def.options || null,
  };
}