import { parseISO } from 'date-fns';
import { localNow } from '@/lib/localClock';

// Timezone options exactly as per the UI reference
export const TIMEZONES = [
  { key: 'perth', label: 'GMT+08:00 Perth (AWST)' },
  { key: 'adelaide', label: 'GMT+09:30 Adelaide (ACST)' },
  { key: 'darwin', label: 'GMT+09:30 Darwin (ACST)' },
  { key: 'brisbane', label: 'GMT+10:00 Brisbane (AEST)' },
  { key: 'canberra', label: 'GMT+10:00 Canberra (AEST)' },
  { key: 'hobart', label: 'GMT+10:00 Hobart (AEST)' },
  { key: 'sydney', label: 'GMT+10:00 Sydney (AEST)' },
];

export const MEETING_TYPES = [
  { key: 'online', label: 'Online' },
  { key: 'in_person', label: 'In Person' },
  { key: 'hybrid', label: 'Hybrid' },
];

/**
 * A meeting is "upcoming" through the end of its own calendar date — it flips to
 * Past at midnight, not 24h later. The split is date-based on purpose: the
 * scheduled start/end time is ignored, so a meeting stays Upcoming for the whole
 * of its day. Defaults to the viewer's device clock, matching the overdue
 * checks elsewhere in the app.
 *
 * A meeting with no (or an unparseable) date is treated as Past: date and times
 * are mandatory at creation, so an undated record is a legacy artefact and must
 * never sit in the Upcoming tab forever.
 */
export function isUpcoming(meeting, now = localNow()) {
  if (!meeting?.meeting_date) return false;
  let date;
  try {
    date = parseISO(meeting.meeting_date);
  } catch {
    return false;
  }
  if (isNaN(date.getTime())) return false;
  // Midnight at the end of the meeting's calendar date.
  const cutoff = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  cutoff.setHours(23, 59, 59, 999);
  return now.getTime() <= cutoff.getTime();
}

/**
 * Australian financial year for a meeting date (1 Jul – 30 Jun).
 * e.g. a date of 2025-08-01 → "FY 2025-26", 2025-03-01 → "FY 2024-25".
 */
export function financialYearLabel(meetingDate) {
  if (!meetingDate) return 'No date';
  let date;
  try {
    date = parseISO(meetingDate);
  } catch {
    return 'No date';
  }
  if (isNaN(date.getTime())) return 'No date';
  const y = date.getFullYear();
  const startYear = date.getMonth() >= 6 ? y : y - 1; // month 6 = July
  const endShort = String((startYear + 1) % 100).padStart(2, '0');
  return `FY ${startYear}-${endShort}`;
}

// Resolve a meeting's group label for a given grouping key.
export function meetingGroupLabel(meeting, groupBy) {
  if (groupBy === 'committee') return meeting.committee_name || 'No committee';
  if (groupBy === 'financial_year') return financialYearLabel(meeting.meeting_date);
  if (groupBy === 'calendar_year') return meeting.calendar_year ? String(meeting.calendar_year) : 'No year';
  return null;
}

// Does a meeting pass the BoardFilterPanel filter set?
// filters shape: { committee: [], financial_year: [], calendar_year: [] }
export function meetingMatchesFilters(meeting, filters) {
  if (!filters) return true;
  if (filters.committee?.length && !filters.committee.includes(meeting.committee_name || 'No committee')) return false;
  if (filters.financial_year?.length && !filters.financial_year.includes(financialYearLabel(meeting.meeting_date))) return false;
  if (filters.calendar_year?.length && !filters.calendar_year.includes(meeting.calendar_year ? String(meeting.calendar_year) : 'No year')) return false;
  return true;
}

export const MEETING_GROUP_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'committee', label: 'Meeting Committee' },
  { key: 'financial_year', label: 'Financial Year' },
  { key: 'calendar_year', label: 'Calendar Year' },
];

// Format "HH:mm" 24h -> "h:mm AM/PM"
export function formatTime12(value) {
  if (!value) return '';
  const [hStr, mStr] = value.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${period}`;
}