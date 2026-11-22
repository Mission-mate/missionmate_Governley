import { tracksCount, tracksCompletion } from './tracking/trackingConfig';

/**
 * Tabs shown on the Level 6 deliverable page.
 * Overview is always present; Tasks & Milestones / Data Reporting / Data Visualisation
 * follow the block's tracking method. Strategic Initiatives (Projects) always get
 * Tasks & Milestones only. Data Visualisation is count-only because task completion
 * isn't numeric.
 */
export function level6PaneTabs(block, includeRecords = false) {
  const tc = block?.tracking_config;
  const level = block?.level;
  const tabs = [{ key: 'overview', label: 'Overview' }];
  if (tracksCompletion(tc, level)) tabs.push({ key: 'completion', label: 'Milestones' });
  if (tracksCount(tc, level)) tabs.push({ key: 'count', label: 'Data' });
  if (includeRecords) tabs.push({ key: 'notes', label: 'Notes' }, { key: 'documents', label: 'Documents' });
  return tabs;
}

/**
 * Compact tab set for the right-side view pane — short labels so they fit on one
 * row, and no Data Visualisation tab (charts live on the full deliverable page).
 */
export function level6PaneTabsCompact(block) {
  const tc = block?.tracking_config;
  const level = block?.level;
  const tabs = [{ key: 'overview', label: 'Overview' }];
  if (tracksCompletion(tc, level)) tabs.push({ key: 'completion', label: 'Milestones' });
  if (tracksCount(tc, level)) tabs.push({ key: 'count', label: 'Data' });
  tabs.push({ key: 'notes', label: 'Notes' }, { key: 'documents', label: 'Documents' });
  return tabs;
}