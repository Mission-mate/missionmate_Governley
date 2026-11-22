/**
 * Guard projection: compare only the form's own fields (the keys of its EMPTY
 * template), optionally skipping auto-filled defaults such as a suggested ID.
 */
export function pickFields(template, skip = []) {
  const keys = Object.keys(template).filter((k) => !skip.includes(k));
  return (v) => {
    const out = {};
    keys.forEach((k) => { out[k] = v?.[k] ?? template[k]; });
    return out;
  };
}