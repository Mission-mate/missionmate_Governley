import { OPTION_COLORS } from '@/lib/registerColors';

/**
 * Build a styleFor(name) function that returns the coloured pill classes for a
 * risk category option, so categories render as coloured labels everywhere.
 */
export function categoryStyleFn(options) {
  return (name) => {
    const opt = (options || []).find((o) => (typeof o === 'object' ? o.name : o) === name);
    const def = OPTION_COLORS.find((c) => c.id === opt?.color);
    return def ? `${def.bg} ${def.text}` : 'bg-muted text-muted-foreground';
  };
}