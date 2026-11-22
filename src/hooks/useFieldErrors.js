import { useEffect, useRef, useState } from 'react';

/**
 * Field-level validation state shared by all forms.
 * `validate(values)` returns { field: message } for invalid fields.
 * `check()` shows all current errors; afterwards each error clears as soon as
 * its field becomes valid (corrections never surface new errors).
 * `addErrors(map)` shows server-checked errors (e.g. duplicate IDs); each clears
 * once its field's value changes.
 */
export default function useFieldErrors(validate, values) {
  const [errors, setErrors] = useState({});
  const [extra, setExtra] = useState({});
  const snapshot = useRef({});

  useEffect(() => {
    if (!values) return;
    setErrors((prev) => {
      const keys = Object.keys(prev);
      if (!keys.length) return prev;
      const now = validate(values) || {};
      const kept = keys.filter((k) => now[k]);
      if (kept.length === keys.length && kept.every((k) => now[k] === prev[k])) return prev;
      return Object.fromEntries(kept.map((k) => [k, now[k]]));
    });
    setExtra((prev) => {
      const keys = Object.keys(prev);
      const kept = keys.filter((k) => values[k] === snapshot.current[k]);
      return kept.length === keys.length ? prev : Object.fromEntries(kept.map((k) => [k, prev[k]]));
    });
  }, [values]); // eslint-disable-line

  // `subset` optionally validates just part of the form (e.g. one wizard step).
  const check = (subset = validate) => {
    const next = subset(values) || {};
    setErrors(next);
    setExtra({});
    return !Object.keys(next).length;
  };
  const addErrors = (map) => {
    snapshot.current = { ...snapshot.current, ...Object.fromEntries(Object.keys(map).map((k) => [k, values[k]])) };
    setExtra((prev) => ({ ...prev, ...map }));
  };
  const reset = () => { setErrors({}); setExtra({}); };
  return { errors: { ...errors, ...extra }, check, addErrors, reset };
}