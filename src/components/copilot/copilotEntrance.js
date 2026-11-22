/** Timing of the chat pane's entrance, replayed on every open: orb, then the heading letter by letter, then intro and composer. */
const EASE = [0.22, 1, 0.36, 1];
const HEADING_START = 0.45;
const LETTER_STAGGER = 0.03;

export const orbEntrance = {
  initial: { opacity: 0, scale: 0.7, rotate: -120 },
  animate: { opacity: 1, scale: 1, rotate: 0 },
  transition: { duration: 0.7, ease: EASE },
};

export const letterEntrance = (index) => ({
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.36, ease: EASE, delay: HEADING_START + index * LETTER_STAGGER },
});

/** Intro line and composer enter together, just after the heading's last letter. */
export const followEntrance = (letterCount) => ({
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: EASE, delay: HEADING_START + letterCount * LETTER_STAGGER + 0.15 },
});