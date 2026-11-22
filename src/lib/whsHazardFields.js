// Field definitions for the WHS hazard detail page and its linked controls/actions.
import {
  WHS_LIKELIHOOD_OPTIONS, WHS_CONSEQUENCE_OPTIONS, OPEN_CLOSED_OPTIONS, WORK_STATUS_OPTIONS, SOURCE_TYPES,
} from '@/lib/whsRegister';
import { customSection } from '@/lib/whsCustomise';
import { REVIEW_FREQUENCIES, calcNextReviewDate } from '@/lib/reviewDateUtils';

const isEvery = (d) => d.review_frequency === 'Every';

/** Hazard fields; `cfg` is the register's WHS config (categories, sites, people). */
export const hazardSections = (cfg) => [
  {
    title: 'Hazard Details',
    fields: [
      { key: 'hazard_code', label: 'Hazard ID', required: true, unique: 'WhsHazard' },
      { key: 'date_raised', label: 'Date Raised', type: 'date' },
      { key: 'title', label: 'Hazard Title', required: true, wide: true, placeholder: 'e.g., Manual handling in the storeroom' },
      { key: 'description', label: 'Hazard Description', type: 'textarea', wide: true,
        placeholder: 'e.g., Staff lifting heavy boxes in the storeroom could cause back injury' },
      { key: 'category', label: 'Category', type: 'select', options: cfg.hazard_categories },
      { key: 'location', label: 'Location', suggestions: cfg.sites, placeholder: 'e.g., Main office storeroom' },
      { key: 'person_exposed', label: 'Person Exposed', placeholder: 'e.g., Staff, volunteers' },
      { key: 'owner', label: 'Owner', suggestions: cfg.people, placeholder: 'e.g., Operations Manager' },
      { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED_OPTIONS, wide: true, pill: true },
    ],
  },
  {
    title: 'Risk Assessment',
    subtitle: 'Risk severity and potential impact',
    fields: [
      { key: 'likelihood', label: 'Likelihood', type: 'select', options: WHS_LIKELIHOOD_OPTIONS, numeric: true },
      { key: 'consequence', label: 'Consequence', type: 'select', options: WHS_CONSEQUENCE_OPTIONS, numeric: true },
    ],
  },
  {
    title: 'Review Details',
    subtitle: 'Review schedule and upcoming review dates',
    fields: [
      { key: 'review_frequency', label: 'Review Frequency', type: 'select', options: REVIEW_FREQUENCIES, wide: true },
      { key: 'interval_value', label: 'Interval', type: 'number', placeholder: 'e.g. 4', when: isEvery },
      { key: 'interval_unit', label: 'Unit', type: 'select', options: ['Months', 'Years'], when: isEvery },
      { key: 'last_review_date', label: 'Last Review Date', type: 'date',
        hint: 'Updating the Last Review Date automatically recalculates the Next Review Date.' },
      { key: 'next_review_date', label: 'Next Review Date', type: 'computed', overdue: true,
        hint: 'Auto-calculated from frequency and last review date.',
        compute: (d) => (d.last_review_date ? calcNextReviewDate(d.review_frequency, {
          baseDate: d.last_review_date, intervalValue: d.interval_value, intervalUnit: d.interval_unit,
        }) : null) },
    ],
  },
  ...customSection(cfg.hazard_custom_columns),
];

export const hazardFields = (cfg) => hazardSections(cfg).flatMap((s) => s.fields);

export const controlFields = (cfg) => [
  { key: 'title', label: 'Control Title', required: true, wide: true, placeholder: 'e.g., Manual handling training' },
  { key: 'description', label: 'Control Description', type: 'textarea', wide: true, placeholder: 'e.g., Annual training on safe lifting techniques for all staff' },
  { key: 'owner', label: 'Owner', suggestions: cfg.people, placeholder: 'e.g., HR Manager' },
  { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED_OPTIONS, required: true },
  { key: 'additional_details', label: 'Additional Details', type: 'richtext', wide: true,
    placeholder: 'Add implementation notes, inspection frequency, and how this control reduces the hazard...' },
];

export const actionFields = (cfg) => [
  { key: 'action_code', label: 'Action ID', required: true, unique: 'WhsAction' },
  { key: 'source_type', label: 'Source', type: 'locked', format: (v) => SOURCE_TYPES[v]?.label || v },
  { key: 'title', label: 'Action Title', required: true, wide: true, placeholder: 'e.g., Install a trolley in the storeroom' },
  { key: 'action_required', label: 'Action Description', type: 'textarea', wide: true, placeholder: 'e.g., Purchase and install a trolley so staff no longer carry heavy boxes by hand' },
  { key: 'owner', label: 'Owner', suggestions: cfg.people, placeholder: 'e.g., Facilities Coordinator' },
  { key: 'due_date', label: 'Due Date', type: 'date', overdue: true },
  { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED_OPTIONS, required: true },
  { key: 'stage', label: 'Stage', type: 'select', options: WORK_STATUS_OPTIONS, required: true },
  { key: 'date_completed', label: 'Date Completed', type: 'date' },
  { key: 'verified_by', label: 'Verified By', suggestions: cfg.people, placeholder: 'e.g., WHS Officer' },
  { key: 'additional_details', label: 'Additional Details', type: 'richtext', wide: true,
    placeholder: 'Add implementation notes, completion evidence, or follow-up details for this action...' },
];

/** Display text for a stored value. */
export function fieldText(field, value) {
  if (value === undefined || value === null || value === '') return '';
  if (field.format) return field.format(value);
  if (field.numeric) return field.options.find((o) => o.value === value)?.label || String(value);
  return String(value);
}