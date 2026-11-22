import { format, parseISO } from 'date-fns';

/** yyyy-MM-dd → "13 Oct 2026" (Fixed Asset Register format; empty for blanks). */
export const formatDisplayDate = (v) => (v ? format(parseISO(v), 'd MMM yyyy') : '');