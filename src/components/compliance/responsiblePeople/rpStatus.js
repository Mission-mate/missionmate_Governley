/** Responsible person status options with their label colours (green = Current, gray = Past). */
export const RP_STATUS_OPTIONS = [
  { name: 'Current', color: 'green' },
  { name: 'Past', color: 'gray' },
];

export const rpStatusColor = (status) => RP_STATUS_OPTIONS.find((o) => o.name === status)?.color;