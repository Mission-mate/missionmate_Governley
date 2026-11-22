import { useState, useCallback } from 'react';

/** One-card-at-a-time edit lock for a set of section cards. */
export default function useCardEditLock() {
  const [active, setActive] = useState(null);
  const bind = useCallback((key) => ({
    locked: !!active && active !== key,
    onEditingChange: (editing) => setActive((a) => (editing ? key : a === key ? null : a)),
  }), [active]);
  return bind;
}