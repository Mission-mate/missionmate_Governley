// Defensive readers for saved customiser configuration. Valid data passes through
// unchanged; malformed entries are dropped and missing lists fall back to defaults.

const nameOf = (o) => (typeof o === 'string' ? o : o && typeof o.name === 'string' ? o.name : null);

/** Option list stored as plain strings (WHS lists). */
export function toNameList(value, defaults = []) {
  if (!Array.isArray(value)) return defaults;
  return value.map(nameOf).filter((n) => n != null);
}

/** Option list stored as { id, name } objects (asset lists). */
export function toIdOptions(value, defaults = []) {
  if (!Array.isArray(value)) return defaults;
  return value
    .map((o, i) => {
      const name = nameOf(o);
      return name == null ? null : { ...(typeof o === 'object' ? o : {}), id: o?.id || `opt-${i + 1}`, name };
    })
    .filter(Boolean);
}

/** Custom column definitions: [{ id, title, type, config: { options? } }]. */
export function toCustomColumns(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((c) => c && typeof c === 'object' && c.id && c.type)
    .map((c) => {
      const config = c.config && typeof c.config === 'object' ? c.config : {};
      const next = { ...c, title: typeof c.title === 'string' ? c.title : '', config };
      if (config.options !== undefined) {
        next.config = {
          ...config,
          options: (Array.isArray(config.options) ? config.options : [])
            .filter((o) => o && typeof o.name === 'string'),
        };
      }
      return next;
    });
}

/** Cleans a draft's custom columns for saving, keeping table visibility. */
export const cleanCustomColumns = (cols) => cols.map((c) => ({
  id: c.id, title: c.title, type: c.type,
  ...(c.table_visible ? { table_visible: true } : {}),
  config: c.type === 'Single Select'
    ? { ...c.config, options: (c.config?.options || []).filter((o) => o.name.trim()) }
    : c.config || {},
}));