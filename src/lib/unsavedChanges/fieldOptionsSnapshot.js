/**
 * Projection for the "Customise Fields" option panes: only the managed fields'
 * option names (and colours) are compared, blank option rows are ignored, so an
 * untouched field can never trigger the discard prompt.
 */
export const fieldOptionsSnapshot = (ids) => (fields) =>
  ids.map((id) => {
    const field = (fields || []).find((f) => f.id === id);
    return (field?.config?.options || [])
      .filter((o) => (o.name || '').trim())
      .map((o) => ({ name: o.name, color: o.color }));
  });