// Plain-language explanations of how each Risk Overview summary card is calculated.
export const SUMMARY_GUIDES = {
  'Inherent Risk Index': {
    intro: 'How risky things are before any controls are in place — shown as a single score out of 100.',
    steps: [
      'For each risk, multiply its inherent Likelihood (1–5) by its inherent Consequence (1–5). That gives a raw score of 1–25.',
      'Average those raw scores across all risks that have been assessed.',
      'Multiply the average by 4 so it reads on a familiar 0–100 scale.',
    ],
    example: 'Two risks scoring 12 and 20 average 16 → 16 × 4 = 64 out of 100.',
    note: 'Because it is an average, the index stays comparable as your register grows — adding more low risks will not inflate the number.',
  },
  'Residual Risk Index': {
    intro: 'The same score, but using your residual (after controls) likelihood and consequence ratings.',
    steps: [
      'For each risk, multiply residual Likelihood by residual Consequence (1–25).',
      'Average those scores across all risks with a residual assessment.',
      'Multiply by 4 for the 0–100 scale.',
    ],
    example: 'Residual scores of 6 and 12 average 9 → 9 × 4 = 36 out of 100.',
    note: 'A residual index well below the inherent index means your controls are doing real work.',
  },
  'Risk Reduction': {
    intro: 'How much of your inherent risk exposure your controls remove.',
    steps: [
      'Take the Inherent Risk Index and the Residual Risk Index.',
      'Subtract residual from inherent to get the amount removed.',
      'Divide that by the inherent index and show it as a percentage.',
    ],
    example: 'Inherent 49 and residual 36 → (49 − 36) ÷ 49 = 27% reduction.',
    note: 'Higher is better. 0% means controls are not lowering your ratings at all.',
  },
  'Operating Control Effectiveness Rate': {
    intro: 'The share of your assessed controls that are actually operating effectively in practice.',
    steps: [
      'Look only at controls whose operating effectiveness has been assessed (anything other than Not Assessed).',
      'Count the controls rated Effective for operating effectiveness.',
      'Divide that count by the assessed controls and show it as a percentage.',
    ],
    example: '5 assessed controls, 2 of them rated Effective in operation → 2 ÷ 5 = 40%.',
    note: 'Only operating effectiveness is used — design effectiveness is not part of this figure. Partially Effective and Ineffective controls count against the rate, and unassessed controls are left out entirely.',
  },
  'Risks Outside Appetite': {
    intro: 'How many risks sit at or above the risk level your organisation has agreed to accept.',
    steps: [
      'Read the Organizational Risk Appetite Threshold set on the Risk Appetite panel (0–25).',
      'Calculate each risk’s residual score (Likelihood × Consequence).',
      'Count every risk whose residual score is equal to or greater than the threshold.',
    ],
    example: 'With a threshold of 15, a risk scoring 16 is outside appetite; one scoring 9 is within.',
    note: 'Move the appetite slider and this count updates instantly — it always reflects your current threshold.',
  },
};