import { formatMoney } from '@/lib/giftRegister';

/** "+$1,000.00" / "-$500.00" / "—" for an unchanged value. */
export function formatSignedMoney(v) {
  const n = Number(v || 0);
  if (!n) return '—';
  return `${n > 0 ? '+' : '-'}${formatMoney(Math.abs(n))}`;
}