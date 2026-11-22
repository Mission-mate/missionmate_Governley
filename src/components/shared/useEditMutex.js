import { useState } from 'react';
import useDirtyFlag from '@/hooks/useDirtyFlag';

/**
 * Exclusive ("mutex") edit mode for a set of section cards, with dirty-only blocking.
 *
 * Only one section can be in edit mode at a time. While the active section has
 * unsaved changes it is "blocked": other cards must disable their Edit triggers
 * (using `editBlocked`) so a draft can never be lost. A clean draft does not
 * block — switching away from it is immediate and silent.
 *
 * Cards report their own draft state through setDirty(true) on any field change.
 */
export default function useEditMutex() {
  const [editingSection, setEditingSection] = useState(null);
  const [dirty, setDirtyState] = useState(false);

  const setDirty = (value = true) => setDirtyState(value);

  const editBlocked = !!editingSection && dirty;
  // Page tabs / back links and the browser warning read this via the registry.
  useDirtyFlag(editBlocked);

  const requestEdit = (key) => {
    if (editingSection === key) return;
    // Guard rail — triggers are already disabled while blocked.
    if (editBlocked) return;
    setDirtyState(false);
    setEditingSection(key);
  };

  const closeEdit = () => {
    setDirtyState(false);
    setEditingSection(null);
  };

  return { editingSection, requestEdit, closeEdit, setDirty, editBlocked };
}