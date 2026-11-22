/**
 * Canonical membership expiration calculation.
 *
 * SINGLE SOURCE OF TRUTH — imported by both:
 *  - base44/functions/submitMembershipForm/entry.ts (Deno backend, public form)
 *  - src/lib/membership.js (Vite frontend, admin create/edit flows)
 *
 * Keep this module dependency-free and runtime-agnostic (no date-fns, no npm:
 * imports, no Deno APIs) so both runtimes execute it identically.
 *
 * Dates are handled as plain local calendar dates built from yyyy-MM-dd parts,
 * so the result never shifts with the host timezone.
 */

/** Format a Date as yyyy-MM-dd using its local calendar parts. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a yyyy-MM-dd (or ISO datetime) string into a local calendar Date. */
export function parseIsoDate(value: string): Date | null {
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  const fallback = new Date(value);
  return isNaN(fallback.getTime()) ? null : fallback;
}

/** Add N months, clamping to the last day of the target month on overflow. */
function addMonths(date: Date, months: number): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() < day) d.setDate(0); // e.g. 31 Jan + 1 month -> 28/29 Feb
  return d;
}

/**
 * Calculate a member's expiration date from their start date and the selected
 * membership structure. Returns '' when the membership never expires.
 *
 * Honours the structure's renewal_calculation:
 *  - 'Fixed renewal date'   -> next occurrence of specific_expiration_day/month
 *  - 'Calendar year cycle'  -> 31 December of the start year
 *  - 'Financial year cycle' -> next 30 June (AU financial year)
 *  - 'Based on date joined' -> start + duration_months (default)
 */
export function calcExpirationDate(startDate: string, structure: any): string {
  if (!startDate || !structure) return '';
  if (structure.is_lifetime) return '';

  const start = parseIsoDate(startDate);
  if (!start) return '';

  const months = Number(structure.duration_months) || 0;
  if (months <= 0) return '';

  const calc = structure.renewal_calculation;

  // Fixed renewal date — next occurrence of the configured day/month.
  if (calc === 'Fixed renewal date') {
    const day = Number(structure.specific_expiration_day) || 1;
    const monthIdx = (Number(structure.specific_expiration_month) || 1) - 1;
    let target = new Date(start.getFullYear(), monthIdx, day);
    if (target <= start) target = new Date(start.getFullYear() + 1, monthIdx, day);
    return toIsoDate(target);
  }

  // Calendar year cycle — expires end of the current calendar year.
  if (calc === 'Calendar year cycle') {
    return toIsoDate(new Date(start.getFullYear(), 11, 31));
  }

  // Australian financial year cycle — expires 30 June.
  if (calc === 'Financial year cycle') {
    const fyEnd = start.getMonth() >= 6
      ? new Date(start.getFullYear() + 1, 5, 30)
      : new Date(start.getFullYear(), 5, 30);
    return toIsoDate(fyEnd);
  }

  // Default — based on date joined.
  return toIsoDate(addMonths(start, months));
}