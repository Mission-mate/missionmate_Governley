// Shared sorting logic for the Risk / Action / Controls register grids.

const RATING_RANK = {
  'Very Low': 1,
  'Low': 2,
  'Tolerable': 3,
  'High': 4,
  'Very High': 5,
};

// Sort field options offered in the Sort menu. `key` selects which value
// comparator to use; not every register supports every field.
export const SORT_OPTIONS = {
  rating: { id: 'rating', label: 'Risk Rating', ascLabel: 'Low to High', descLabel: 'High to Low' },
  next_review: { id: 'next_review', label: 'Next Review', ascLabel: 'Oldest to Newest', descLabel: 'Newest to Oldest' },
  due_date: { id: 'due_date', label: 'Due Date', ascLabel: 'Oldest to Newest', descLabel: 'Newest to Oldest' },
};

// Resolve the comparable value for a row given the sort field and which
// rating/review keys this register uses.
function valueFor(row, field, keys) {
  if (field === 'rating') {
    return RATING_RANK[row[keys.rating]] || 0;
  }
  if (field === 'next_review') {
    const v = row[keys.nextReview];
    return v ? new Date(v).getTime() : null;
  }
  if (field === 'due_date') {
    const v = row[keys.dueDate];
    return v ? new Date(v).getTime() : null;
  }
  return null;
}

/**
 * Returns a sorted copy of `rows`. Rows with no value for the active field are
 * always pushed to the end, regardless of direction.
 * @param {object} sort - { field, direction: 'asc' | 'desc' } or null
 * @param {object} keys - { rating, nextReview, dueDate } field name mapping
 */
export function sortRows(rows, sort, keys) {
  if (!sort || !sort.field) return rows;
  const dir = sort.direction === 'desc' ? -1 : 1;
  return [...rows].sort((a, b) => {
    const va = valueFor(a, sort.field, keys);
    const vb = valueFor(b, sort.field, keys);
    const aEmpty = va === null || va === 0 || va === undefined;
    const bEmpty = vb === null || vb === 0 || vb === undefined;
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    return (va - vb) * dir;
  });
}