/**
 * Frontend copy of base44/shared/membershipExpiration.ts (the browser cannot
 * load backend modules). Keep both in sync.
 */
function toIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value) {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

function addMonths(date, months) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0);
  return d;
}

export function calcExpirationDate(startDate, structure) {
  if (!startDate || !structure || structure.is_lifetime) return '';
  const start = parseIsoDate(startDate);
  if (!start) return '';
  const months = Number(structure.duration_months) || 0;
  if (months <= 0) return '';
  const calc = structure.renewal_calculation;
  if (calc === 'Fixed renewal date') {
    const day = Number(structure.specific_expiration_day) || 1;
    const monthIdx = (Number(structure.specific_expiration_month) || 1) - 1;
    let target = new Date(start.getFullYear(), monthIdx, day);
    if (target <= start) target = new Date(start.getFullYear() + 1, monthIdx, day);
    return toIsoDate(target);
  }
  if (calc === 'Calendar year cycle') return toIsoDate(new Date(start.getFullYear(), 11, 31));
  if (calc === 'Financial year cycle') {
    return toIsoDate(start.getMonth() >= 6
      ? new Date(start.getFullYear() + 1, 5, 30)
      : new Date(start.getFullYear(), 5, 30));
  }
  return toIsoDate(addMonths(start, months));
}