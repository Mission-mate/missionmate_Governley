// Work Health and Safety register — shared constants, defaults and rules.
// Risk scoring reuses the Risk Register matrix so bands, labels and colours match.
import { getRiskRating, getRiskScore, CONSEQUENCE_OPTIONS, LEVEL_TONES } from '@/lib/riskMatrix';
import { toNameList } from '@/lib/configNormalize';

// WHS shows descriptions only ("Rare", not "1 Rare"); the numeric value still drives scoring.
const withTones = (opts) => opts.map((o) => ({
  ...o, label: String(o.label).replace(/^\d+\s*/, ''), tone: LEVEL_TONES[o.value],
}));

export const WHS_LIKELIHOOD_OPTIONS = withTones([
  { value: 1, label: '1 Rare' },
  { value: 2, label: '2 Minor' },
  { value: 3, label: '3 Possible' },
  { value: 4, label: '4 Likely' },
  { value: 5, label: '5 Almost Certain' },
]);
export const WHS_CONSEQUENCE_OPTIONS = withTones(CONSEQUENCE_OPTIONS);

export const DEFAULT_HAZARD_CATEGORIES = [
  'Slips, Trips and Falls', 'Manual Tasks', 'Plant and Equipment', 'Electrical',
  'Vehicles and Driving', 'Hazardous Chemicals', 'Remote or Isolated Work', 'Home Visits',
  'Psychosocial: Workload', 'Psychosocial: Bullying and Harassment',
  'Psychosocial: Violence and Aggression', 'Psychosocial: Traumatic Events', 'Other',
];

const DEFAULT_INCIDENT_TYPES = ['Injury', 'Illness', 'Near Miss', 'Psychological Injury', 'Violence or Aggression', 'Vehicle Incident', 'Dangerous Incident'];
const DEFAULT_TREATMENTS = ['None', 'First Aid on Site', 'Counselling', 'Medical Treatment', 'Hospital Admission'];

/** Register-level config defaults (stored on ComplianceManagedRegister.config). */
export const WHS_DEFAULT_CONFIG = {
  hazard_review_months: 6,
  notifiable_retention_years: 5,
  extended_absence_days: 15,
  hazard_categories: DEFAULT_HAZARD_CATEGORIES,
  incident_types: DEFAULT_INCIDENT_TYPES,
  treatments: DEFAULT_TREATMENTS,
  sites: [],
  people: [],
};

const LIST_KEYS = ['hazard_categories', 'incident_types', 'treatments', 'sites', 'people'];

export const whsConfig = (register) => {
  const cfg = { ...WHS_DEFAULT_CONFIG, ...(register?.config || {}) };
  LIST_KEYS.forEach((k) => { cfg[k] = toNameList(cfg[k], WHS_DEFAULT_CONFIG[k]); });
  return cfg;
};

export const OPEN_CLOSED = ['Open', 'Closed'];
/** Colour-labelled Open/Closed options for WHS form selects. */
export const OPEN_CLOSED_OPTIONS = [{ name: 'Open', color: 'blue' }, { name: 'Closed', color: 'green' }];
/** Action workflow stages (separate from the Open/Closed lifecycle status). */
export const ACTION_STAGES = ['Not Started', 'In Progress', 'Completed', 'On Hold'];
/** Colour-labelled stage options for WHS form selects. */
export const WORK_STATUS_OPTIONS = [
  { name: 'Not Started', color: 'gray' }, { name: 'In Progress', color: 'blue' },
  { name: 'Completed', color: 'green' }, { name: 'On Hold', color: 'orange' },
];
export const HIGH_AND_ABOVE = ['High', 'Very High'];

export const SOURCE_TYPES = {
  hazard: { label: 'Hazard', entity: 'WhsHazard', codeField: 'hazard_code', prefix: 'HZ' },
  incident: { label: 'Incident', entity: 'WhsIncident', codeField: 'incident_code', prefix: 'INC' },
  safety_check: { label: 'Safety Check', entity: 'WhsSafetyCheck', codeField: 'check_code', prefix: 'CHK' },
};

/** Rating for a hazard; null renders as "Not assessed". */
export const hazardRating = (h) => getRiskRating(h?.likelihood, h?.consequence);
export const hazardScore = (h) => getRiskScore(h?.likelihood, h?.consequence);

/** Next sequential code, e.g. nextCode('HZ', ['HZ-001','HZ-004']) → 'HZ-005'. */
export function nextCode(prefix, existingCodes = []) {
  const max = existingCodes.reduce((m, c) => {
    const n = parseInt(String(c || '').replace(`${prefix}-`, ''), 10);
    return Number.isFinite(n) && n > m ? n : m;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(3, '0')}`;
}