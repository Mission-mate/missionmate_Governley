/**
 * Strategy hierarchy layers.
 *
 * The hierarchy is no longer a fixed 1-7 numeric ladder. Each layer is a named
 * definition with a stable `key` (how the code references it) and a user-facing
 * `name` (the terminology the organisation uses). The numeric `level` is kept as
 * the storage slot on StrategyBlock so blocks stay addressable, but nothing in
 * the UI refers to "Level N" any more.
 */

import { sanitizeStoredLayers } from '@/lib/strategy/hierarchySchema';

/**
 * Single source of truth for the numeric storage slot of each built-in layer.
 * Components reference these constants instead of hard-coding level numbers.
 */
export const LEVELS = {
  VISION: 1,
  THEME: 2,
  PRIORITIES: 3,
  ACTIONS: 5,
  INITIATIVES: 6,
  MEASURES: 7,
  ENABLERS: 8,
  CUSTOM: 9,
};

/**
 * Workspace module each layer renders with. This is the single place that maps a
 * layer to its UI, so components never infer behaviour from a "levelN" name.
 */
export const MODULES = {
  OVERVIEW: 'overview',
  PRIORITIES: 'priorities',
  ACTIONS: 'actions',
  MEASURES: 'measures',
  ENABLERS: 'enablers',
};

/** Built-in layers, in their default order. */
export const BASE_LAYERS = [
  {
    key: 'vision',
    module: 'overview',
    level: 1,
    title: 'Vision',
    name: 'Vision',
    guide: 'The overarching ambition, goal or purpose.',
    canRename: false,
    canDisable: false,
    canReorder: false,
    canDelete: false,
  },
  {
    key: 'theme',
    module: 'overview',
    level: 2,
    title: 'Strategic Themes',
    name: 'Focus Areas',
    guide: 'Focus areas, domains or strategic pillars.',
    canRename: true,
    canDisable: true,
    canReorder: false,
    canDelete: false,
  },
  {
    key: 'priorities',
    module: 'priorities',
    level: 3,
    title: 'Strategic Priorities',
    name: 'Priorities',
    guide: 'Strategic objectives, goals or priorities.',
    canRename: true,
    canDisable: false,
    canReorder: true,
    canDelete: false,
  },
  {
    key: 'actions',
    module: 'actions',
    level: 5,
    title: 'Strategic Actions',
    name: 'Actions',
    guide: 'Key actions and commitments that deliver strategic priorities.',
    canRename: true,
    canDisable: false,
    canReorder: true,
    canDelete: false,
  },
  {
    key: 'initiatives',
    module: 'measures',
    level: 6,
    title: 'Strategic Initiatives',
    name: 'Projects',
    guide: 'Projects, programs, services, activities or deliverables.',
    canRename: true,
    canDisable: true,
    canReorder: true,
    canDelete: false,
  },
  {
    key: 'measures',
    module: 'measures',
    level: 7,
    title: 'Measures',
    name: 'Measures',
    guide: 'Performance measures, metrics, indicators, KPIs or targets.',
    canRename: true,
    canDisable: true,
    canReorder: true,
    canDelete: false,
  },
  {
    key: 'enablers',
    module: 'enablers',
    level: 8,
    title: 'Enablers',
    name: 'Enablers',
    guide: 'Foundational capabilities, resources and infrastructure.',
    canRename: true,
    canDisable: true,
    canReorder: false,
    canDelete: false,
  },
  {
    key: 'custom',
    module: 'actions',
    level: 9,
    title: 'Custom',
    name: 'Custom',
    guide: 'An additional custom layer for your strategic framework.',
    canRename: true,
    canDisable: true,
    canReorder: true,
    canDelete: false,
  },
];

/** Layers switched off by default until the user enables them. */
const DEFAULT_DISABLED_KEYS = new Set(['custom']);

/** Every layer key the current build understands. */
const KNOWN_KEYS = new Set(BASE_LAYERS.map((l) => l.key));

/**
 * Resolved layers are cached per Strategy object identity, so repeated
 * getLayers() calls across the component tree cost nothing and return a stable
 * reference. A refetched strategy is a new object, so the cache self-invalidates.
 */
const LAYER_CACHE = new WeakMap();

/** Build a full layer definition for a stored layer record. */
function hydrate(stored) {
  const def = BASE_LAYERS.find((l) => l.key === stored.key);
  if (!def) return null;
  return {
    ...def,
    name: def.canRename ? (stored.name || '').trim() || def.name : def.name,
    enabled: def.canDisable ? stored.enabled !== false : true,
  };
}

/**
 * Resolve the ordered, hydrated layer list for a strategy.
 * Falls back to the built-in defaults when nothing has been configured yet.
 */
export function getLayers(strategy) {
  const cached = LAYER_CACHE.get(strategy || {});
  if (cached) return cached;

  const stored = sanitizeStoredLayers(strategy?.strategy_layers, {
    knownKeys: KNOWN_KEYS,
    onWarn: (msg) => console.warn(`[strategyLayers] ${msg}`),
  });
  if (!stored) {
    const defaults = BASE_LAYERS.map((l) => ({ ...l, enabled: !DEFAULT_DISABLED_KEYS.has(l.key) }));
    if (strategy) LAYER_CACHE.set(strategy, defaults);
    return defaults;
  }
  const layers = stored.map(hydrate).filter(Boolean);
  // Any built-in layer missing from the stored config is re-appended so the
  // hierarchy can never lose a mandatory layer.
  BASE_LAYERS.forEach((def, i) => {
    if (!layers.some((l) => l.key === def.key)) {
      layers.splice(Math.min(i, layers.length), 0, { ...def, enabled: !DEFAULT_DISABLED_KEYS.has(def.key) });
    }
  });
  // Enablers always sit at the bottom of the hierarchy — unless the Custom layer
  // was left in its default spot below Enablers, in which case it stays last.
  const customBelowEnablers =
    layers.findIndex((l) => l.key === 'custom') > layers.findIndex((l) => l.key === 'enablers');
  const ei = layers.findIndex((l) => l.key === 'enablers');
  if (ei > -1) layers.push(layers.splice(ei, 1)[0]);
  if (customBelowEnablers) {
    const ci = layers.findIndex((l) => l.key === 'custom');
    if (ci > -1) layers.push(layers.splice(ci, 1)[0]);
  }
  if (strategy) LAYER_CACHE.set(strategy, layers);
  return layers;
}

/** Ordered layers that are currently switched on. */
export function getEnabledLayers(strategy) {
  return getLayers(strategy).filter((l) => l.enabled);
}

export function getLayerByLevel(strategy, level) {
  return getLayers(strategy).find((l) => l.level === Number(level)) || null;
}

export function getLayerByKey(strategy, key) {
  return getLayers(strategy).find((l) => l.key === key) || null;
}

/**
 * Comparator ordering blocks by their layer's position in the strategy's
 * hierarchy, then by row order. Storage slots are identifiers, not a ranking,
 * so blocks must never be ordered by comparing slot numbers.
 */
export function hierarchySorter(strategy) {
  const rank = new Map(getLayers(strategy).map((l, i) => [l.level, i]));
  const rankOf = (b) => rank.get(Number(b.level)) ?? rank.size;
  return (a, b) => rankOf(a) - rankOf(b) || (a.order_index || 0) - (b.order_index || 0);
}

/** Serialise the editor's layer list into the shape persisted on the Strategy. */
export function serializeLayers(layers) {
  return layers.map((l) => ({
    key: l.key,
    level: l.level,
    name: l.name,
    enabled: l.enabled !== false,
  }));
}