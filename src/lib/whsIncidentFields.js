// Field definitions for the WHS incident detail page, grouped by section.
import { OPEN_CLOSED_OPTIONS, WORK_STATUS_OPTIONS } from '@/lib/whsRegister';
import { customSection } from '@/lib/whsCustomise';

const INVESTIGATION_STATUS_OPTIONS = [...WORK_STATUS_OPTIONS, { name: 'Cancelled', color: 'red' }];

const YES_NO = ['Yes', 'No'];
const IMPACTS = ['No Impact', 'Minor', 'Limited', 'Major', 'Catastrophic'];
const NOTIFICATION = ['Yes', 'Not Required'];
const investigating = (d) => d.investigation_required === 'Yes';
const notifiable = (d) => d.regulator_notification === 'Yes';

/** `investigationFooter(record)` renders detail-only content (the summary note link) under the Investigation fields. */
export const incidentSections = (cfg, { investigationFooter } = {}) => [
  {
    title: 'Incident Details',
    fields: [
      { key: 'incident_code', label: 'Incident ID', required: true, unique: 'WhsIncident' },
      { key: 'status', label: 'Status', type: 'select', options: OPEN_CLOSED_OPTIONS, pill: true },
      { key: 'title', label: 'Incident Title', required: true, wide: true, placeholder: 'e.g., Slip on wet kitchen floor' },
      { key: 'description', label: 'Description', type: 'textarea', wide: true, placeholder: 'e.g., Volunteer slipped on a wet floor in the kitchen' },
      { key: 'incident_type', label: 'Incident Type', type: 'select', options: cfg.incident_types },
      { key: 'incident_date', label: 'Incident Date', type: 'date' },
      { key: 'location', label: 'Location', suggestions: cfg.sites, placeholder: 'e.g., Community centre kitchen' },
      { key: 'person_exposed', label: 'Person Involved', suggestions: cfg.people, placeholder: 'e.g., Jane Smith' },
      { key: 'person_type', label: 'Person Type', placeholder: 'e.g., Employee, contractor, volunteer' },
      { key: 'treatment', label: 'Treatment', type: 'select', options: cfg.treatments },
      { key: 'business_impact', label: 'Business Impact', type: 'select', options: IMPACTS },
      { key: 'date_closed', label: 'Date Incident Closed', type: 'date' },
    ],
  },
  {
    title: 'Investigation',
    fields: [
      { key: 'investigation_required', label: 'Investigation Required', type: 'select', options: YES_NO },
      { key: 'investigation_status', label: 'Investigation Status', type: 'select', options: INVESTIGATION_STATUS_OPTIONS, when: investigating },
    ],
    footer: investigationFooter && ((d) => (investigating(d) ? investigationFooter(d) : null)),
  },
  {
    title: 'Regulator Notification',
    fields: [
      { key: 'regulator_notification', label: 'Notifiable', type: 'select', options: NOTIFICATION },
      { key: 'regulator_notified_date', label: 'Date Notified', type: 'date', when: notifiable },
      { key: 'regulator_reference', label: 'Regulator Reference', wide: true, when: notifiable, placeholder: 'e.g., NTW-2026-00123' },
    ],
  },
  ...customSection(cfg.incident_custom_columns),
];

export const incidentFields = (cfg) => incidentSections(cfg).flatMap((s) => s.fields);