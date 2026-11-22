import { createContext, useContext, useEffect, useRef, useState } from 'react';

/**
 * Per-field Customise Fields state. Cards start collapsed and view-only; the pencil
 * puts one (and only one) into edit mode — other cards are locked until it saves or
 * cancels. Each card saves or cancels on its own — Save persists
 * only that field (merged onto the last saved config), Cancel restores that field.
 * Actions outside edit mode (visibility, reorder, column delete, Priority) save at once.
 *
 * Usage (pane): const fc = useFieldCustomiser({ isOpen, load, persist, normalize, listKey });
 *               <FieldEditProvider value={fc.value}> … fc.draft …
 * Usage (card): const { expanded, editing, toggle, edit, save, cancel, saving, busy } = useFieldEdit(id);
 *
 * `persist(next, prev)` writes the whole config; return false to abort (e.g. a declined confirm).
 */
const FieldEditContext = createContext(null);

export const FieldEditProvider = FieldEditContext.Provider;

const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const withFlag = (set, id, on) => {
  const next = new Set(set);
  if (on) next.add(id); else next.delete(id);
  return next;
};

/**
 * Copies one field from `src` into `dst`. Array configs hold fields by id; object configs
 * hold option lists by key and custom columns under `listKey` (absent in `src` = removed).
 */
export function pickField(src, dst, id, listKey = 'custom') {
  const swap = (list, from) => {
    const item = from.find((x) => x.id === id);
    if (!item) return list.filter((x) => x.id !== id);
    return list.some((x) => x.id === id) ? list.map((x) => (x.id === id ? item : x)) : [...list, item];
  };
  if (Array.isArray(dst)) return swap(dst, src);
  if (hasOwn(src, id) || hasOwn(dst, id)) return { ...dst, [id]: src[id] };
  return { ...dst, [listKey]: swap(dst[listKey], src[listKey]) };
}

/** Normalizer for array configs of option fields: drops blank option names. */
export const cleanOptionFields = (fields) => fields.map((f) => ({
  ...f, config: { ...f.config, options: (f.config?.options || []).filter((o) => o.name.trim()) },
}));

const orderByIds = (list, ids) => {
  const rank = (id) => { const i = ids.indexOf(id); return i === -1 ? ids.length : i; };
  return [...list].sort((a, b) => rank(a.id) - rank(b.id));
};

export function useFieldCustomiser({ isOpen = true, load, persist, normalize = (c) => c, listKey = 'custom' }) {
  const [saved, setSaved] = useState(load);
  const savedRef = useRef(saved);
  const [draft, setDraft] = useState(saved);
  const [expanded, setExpanded] = useState(() => new Set());
  // Only one field may be in edit mode at a time; every other card is locked until it saves or cancels.
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const s = load();
    savedRef.current = s;
    setSaved(s); setDraft(s);
    setExpanded(new Set()); setEditingId(null);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const store = async (key, next) => {
    setSavingId(key);
    try {
      const clean = normalize(next);
      if ((await persist(clean, savedRef.current)) === false) return null;
      savedRef.current = clean;
      setSaved(clean);
      return clean;
    } finally {
      setSavingId(null);
    }
  };

  const stopEditing = (id) => setEditingId((cur) => (cur === id ? null : cur));
  const edit = (id) => {
    if (editingId && editingId !== id) return;
    setExpanded((s) => withFlag(s, id, true));
    setEditingId(id);
  };

  const commit = async (id) => {
    const clean = await store(id, pickField(draft, savedRef.current, id, listKey));
    if (!clean) return;
    setDraft((d) => pickField(clean, d, id, listKey));
    stopEditing(id);
  };
  const cancel = (id) => { setDraft((d) => pickField(savedRef.current, d, id, listKey)); stopEditing(id); };

  // Immediate change: applied to the draft and saved onto the last saved config.
  const change = (fn) => { setDraft(fn); return store('*', fn(savedRef.current)); };
  const mapColumns = (fn) => (d) => ({ ...d, [listKey]: fn(d[listKey]) });

  return {
    draft,
    setDraft,
    saved,
    saving: !!savingId,
    editingId,
    change,
    value: {
      isExpanded: (id) => expanded.has(id),
      isEditing: (id) => editingId === id,
      isLocked: (id) => !!editingId && editingId !== id,
      toggle: (id) => setExpanded((s) => withFlag(s, id, !s.has(id))),
      edit,
      commit,
      cancel,
      savingId,
    },
    addColumn: (col) => { setDraft(mapColumns((cols) => [...cols, col])); edit(col.id); },
    updateColumn: (col) => setDraft(mapColumns((cols) => cols.map((c) => (c.id === col.id ? col : c)))),
    removeColumn: (id) => {
      const fn = mapColumns((cols) => cols.filter((c) => c.id !== id));
      stopEditing(id);
      if (savedRef.current[listKey].some((c) => c.id === id)) return change(fn);
      setDraft(fn);
    },
    setColumnVisible: (id, visible) =>
      change(mapColumns((cols) => cols.map((c) => (c.id === id ? { ...c, table_visible: visible } : c)))),
    reorderColumns: (from, to) => {
      const ids = draft[listKey].map((c) => c.id);
      const [moved] = ids.splice(from, 1);
      ids.splice(to, 0, moved);
      return change(mapColumns((cols) => orderByIds(cols, ids)));
    },
  };
}

export function useFieldEdit(id) {
  const ctx = useContext(FieldEditContext);
  return {
    expanded: ctx.isExpanded(id),
    editing: ctx.isEditing(id),
    locked: ctx.isLocked(id),
    toggle: () => ctx.toggle(id),
    edit: () => ctx.edit(id),
    save: () => ctx.commit(id),
    cancel: () => ctx.cancel(id),
    saving: ctx.savingId === id,
    busy: !!ctx.savingId,
  };
}