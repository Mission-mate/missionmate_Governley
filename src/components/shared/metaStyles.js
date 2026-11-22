// Shared metadata styling for Notes and Checklist detail pages.

// Muted-blue icon circle — same palette as PersonInitialsAvatar, so owner initials and icons match.
export const META_ICON_CIRCLE = 'shrink-0 inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#E8EDF7] text-[#3F5798] dark:bg-primary/20 dark:text-primary-foreground';

// Subtle editable affordance: soft surface tint on hover / focus (add padding at the call site).
export const META_EDITABLE = 'rounded-full cursor-pointer transition-colors hover:bg-muted/70 focus-within:bg-muted/70 focus-visible:bg-muted/70 hover:text-foreground outline-none';