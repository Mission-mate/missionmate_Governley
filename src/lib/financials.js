/** Format a number as USD currency, e.g. 1234.5 -> "$1,234.50". */
export function fmtCurrency(value) {
  const n = Number(value || 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Authoritative guard for every currency/amount value before it reaches an
 * entity payload. Blank resolves to 0; a finite, non-negative number is
 * returned as a number; anything else (NaN, Infinity, negative, garbage text)
 * returns null, meaning "invalid — do not save".
 */
export function parseAmount(value) {
  if (value === '' || value === null || value === undefined) return 0;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** Sum a list of items by a selector function. */
export function sumBy(items, selector) {
  return (items || []).reduce((acc, item) => acc + Number(selector(item) || 0), 0);
}