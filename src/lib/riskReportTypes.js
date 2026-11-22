import { FileText, CalendarClock, ListChecks } from 'lucide-react';

/**
 * Registry of the risk report types available in the Analytics tab.
 * Each entry drives the selector UI, the backend function invoked on generate,
 * and the AppConfig key its last-generated snapshot is stored under.
 */
export const REPORT_TYPES = [
  {
    id: 'comprehensive',
    label: 'Comprehensive Risk Report',
    short: 'Comprehensive',
    description: "A board-ready, point-in-time snapshot of your organisation's overall risk posture.",
    icon: FileText,
    fn: 'generateRiskReport',
    configKey: 'risk_report_snapshot',
    emptyHint: "Generate a Comprehensive Risk Report to produce a point-in-time, board-ready assessment of your organisation's risk posture.",
  },
  {
    id: 'overdue_risks',
    label: 'Overdue Risks Report',
    short: 'Overdue Risks',
    description: 'An assessment of every open risk whose scheduled review date has passed, prioritised by rating, status and appetite.',
    icon: CalendarClock,
    fn: 'generateOverdueRiskReport',
    configKey: 'risk_report_overdue_risks',
    emptyHint: 'Generate an Overdue Risks Report to review all risks that have passed their review date, with how long each has been overdue.',
  },
  {
    id: 'overdue_treatments',
    label: 'Overdue Treatment Actions Report',
    short: 'Overdue Treatments',
    description: 'An assessment of every overdue risk treatment action, the risk it belongs to, prioritised by rating, status and appetite.',
    icon: ListChecks,
    fn: 'generateOverdueTreatmentReport',
    configKey: 'risk_report_overdue_treatments',
    emptyHint: 'Generate an Overdue Treatment Actions Report to review all treatment actions past their due date and the risks they protect against.',
  },
];

export const getReportType = (id) => REPORT_TYPES.find((r) => r.id === id) || REPORT_TYPES[0];