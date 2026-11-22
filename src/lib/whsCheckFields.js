// Field definitions for the WHS safety check detail page.
import { OPEN_CLOSED_OPTIONS } from '@/lib/whsRegister';

import { customSection } from '@/lib/whsCustomise';
import { calcNextReviewDate } from '@/lib/reviewDateUtils';

export const CHECK_FREQUENCIES = [
  { name: 'One-off', color: 'blue' }, { name: 'Monthly', color: 'green' }, { name: 'Quarterly', color: 'orange' },
  { name: 'Annually', color: 'purple' }, { name: 'Ad Hoc', color: 'blue' }, { name: 'Every', color: 'green' },
];
const isEvery = (d) => d.frequency === 'Every';
// Recurring frequencies derive Next Due; One-off / Ad Hoc / unset keep it manual.
const isAuto = (d) => ['Monthly', 'Quarterly', 'Annually', 'Every'].includes(d.frequency);
const LAST_DONE_TIP = 'Updating Last Done recalculates Next Due for recurring frequencies.';
const NEXT_DUE_TIP = 'Auto-calculated from Frequency and Last Done. For One-off and Ad Hoc checks, set it manually.';


export const checkSections = (cfg) => [
  {
    title: 'Check Details',
    fields: [
      { key: 'check_code', label: 'Check ID', required: true, unique: 'WhsSafetyCheck' },
      { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED_OPTIONS, required: true, pill: true },
      { key: 'title', label: 'Title', required: true, wide: true, placeholder: 'e.g., Quarterly fire extinguisher inspection' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true, placeholder: 'e.g., Check pressure gauges and service tags on all extinguishers' },
      { key: 'location', label: 'Location', suggestions: cfg.sites, placeholder: 'e.g., Head office' },
      { key: 'owner', label: 'Owner', suggestions: cfg.people, placeholder: 'e.g., Fire Warden' },
    ],
  },
  {
    title: 'Check Schedule',
    subtitle: 'Frequency and timing of scheduled safety checks',
    fields: [
      { key: 'frequency', label: 'Frequency', type: 'select', options: CHECK_FREQUENCIES, wide: true },
      { key: 'interval_value', label: 'Interval', type: 'number', placeholder: 'e.g. 4', when: isEvery },
      { key: 'interval_unit', label: 'Unit', type: 'select', options: ['Months', 'Years'], when: isEvery },
      { key: 'date_last_done', label: 'Last Done', type: 'date', tooltip: LAST_DONE_TIP },
      { key: 'next_due', label: 'Next Due', type: 'date', overdue: true, tooltip: NEXT_DUE_TIP, when: (d) => !isAuto(d) },
      { key: 'next_due', label: 'Next Due', type: 'computed', overdue: true, tooltip: NEXT_DUE_TIP, when: isAuto,
        compute: (d) => (isAuto(d) && d.date_last_done ? calcNextReviewDate(d.frequency, {
          baseDate: d.date_last_done, intervalValue: d.interval_value, intervalUnit: d.interval_unit,
        }) : d.next_due) },
    ],
  },
  ...customSection(cfg.check_custom_columns),
];

export const checkFields = (cfg) => checkSections(cfg).flatMap((s) => s.fields);