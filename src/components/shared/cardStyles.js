/**
 * Shared section-card surface style — elevated, borderless.
 * Single source of truth so every module's section cards look identical.
 */
export const ELEVATED_CARD =
  'bg-card rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.06),0_4px_10px_rgba(16,24,40,0.10),0_10px_24px_rgba(16,24,40,0.08)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.5),0_4px_12px_rgba(0,0,0,0.35)] dark:ring-1 dark:ring-white/5';

/** Standard inner padding for a section card. */
export const ELEVATED_CARD_PADDING = 'p-7';

/** Elevated list-row card: lifts with a deeper shadow and light tint on hover. */
export const ELEVATED_ROW =
  `${ELEVATED_CARD} transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary/[0.03] hover:shadow-[0_2px_4px_rgba(16,24,40,0.08),0_8px_18px_rgba(16,24,40,0.12),0_16px_32px_rgba(16,24,40,0.10)] dark:hover:bg-primary/[0.06] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.55),0_10px_24px_rgba(0,0,0,0.45)]`;

/** Row action button hover: small lift with a deeper shadow. */
export const LIFT_BUTTON =
  'transition-all duration-200 ease-out hover:-translate-y-px hover:shadow-[0_2px_4px_rgba(16,24,40,0.08),0_6px_12px_rgba(16,24,40,0.12)] dark:hover:shadow-[0_2px_4px_rgba(0,0,0,0.5),0_6px_14px_rgba(0,0,0,0.45)]';

/** Convenience: surface + padding. */
export const ELEVATED_SECTION = `${ELEVATED_CARD} ${ELEVATED_CARD_PADDING}`;