/** Risk register table container — outlined in light mode, elevated borderless surface in dark mode (matches Strategy). */
export const RISK_TABLE =
  'bg-card border border-border rounded-xl dark:border-transparent dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5';

/** Register row — clickable, tint-only hover highlight (theme tokens), selected rows keep their own tint. */
export const registerRowClass = (selected) =>
  selected
    ? 'bg-primary/10 cursor-pointer transition-colors duration-200'
    : 'cursor-pointer transition-colors duration-200 ease-out hover:bg-sidebar-accent/70';