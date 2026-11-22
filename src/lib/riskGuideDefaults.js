// Default System Assessment Criteria for the Risk Guide.
// Categories (names) are fixed and cannot be changed by users — only the
// assessment criteria text can be edited. These defaults mirror the standard
// 5x5 system criteria unless overridden in AppConfig (key: 'risk_guide_criteria').

export const RISK_GUIDE_CONFIG_KEY = 'risk_guide_criteria';

// Consequence (Impact) — locked category name + editable criteria.
export const DEFAULT_CONSEQUENCE_CRITERIA = [
  {
    name: 'Insignificant',
    criteria:
      'No medical treatment\nNo environmental damage\nFinancial implications: Less than $1,000',
  },
  {
    name: 'Minor',
    criteria:
      'Minor injuries and hospitalization\nShort term environmental damage\nFinancial implications: $1,001 - $10,000',
  },
  {
    name: 'Moderate',
    criteria:
      'Moderate irreversible disability\nModerate environmental damage\nFinancial implications: $10,001 - $50,000',
  },
  {
    name: 'Major',
    criteria:
      'Fatality\nSerious irreversible disabilities\nMedium term environmental damage\nFinancial implications: $50,000 - $500,000',
  },
  {
    name: 'Catastrophic',
    criteria:
      'Multiple fatalities\nIrreversible effects\nExtensive environmental damage\nFinancial Implications: More than $500,001',
  },
];

// Likelihood — locked category name + editable criteria.
export const DEFAULT_LIKELIHOOD_CRITERIA = [
  {
    name: 'Rare',
    criteria: 'May occur in exceptional circumstances\nProbability: Every 6 to 30 years',
  },
  {
    name: 'Unlikely',
    criteria: 'Could happen in the future\nProbability: In the next 3 to 5 years',
  },
  {
    name: 'Possible',
    criteria: 'Might happen sometime in the near future\nProbability: Every 1 to 2 years',
  },
  {
    name: 'Likely',
    criteria: 'Could occur in most circumstances\nProbability: Several times a year',
  },
  {
    name: 'Almost Certain',
    criteria: 'Expected to occur in most circumstances\nProbability: Most weeks or months',
  },
];

export function defaultRiskGuideCriteria() {
  return {
    consequence: DEFAULT_CONSEQUENCE_CRITERIA.map((c) => ({ ...c })),
    likelihood: DEFAULT_LIKELIHOOD_CRITERIA.map((c) => ({ ...c })),
  };
}