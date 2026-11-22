/**
 * App-wide registry of dirty editors. A single beforeunload listener is
 * attached only while at least one editor is dirty, and removed once none are.
 */
const dirty = new Set();
const listeners = new Set();

const onBeforeUnload = (e) => {
  e.preventDefault();
  e.returnValue = '';
};

export function setEditorDirty(id, isDirty) {
  const before = dirty.size;
  if (isDirty) dirty.add(id); else dirty.delete(id);
  if (before === 0 && dirty.size > 0) window.addEventListener('beforeunload', onBeforeUnload);
  if (before > 0 && dirty.size === 0) window.removeEventListener('beforeunload', onBeforeUnload);
  if ((before === 0) !== (dirty.size === 0)) listeners.forEach((l) => l(dirty.size > 0));
}

/** True while any registered editor on screen holds unsaved changes. */
export function hasDirtyEditors() {
  return dirty.size > 0;
}

/** Notified with true/false whenever the app flips between clean and dirty. */
export function subscribeDirty(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}