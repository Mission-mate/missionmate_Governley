// Colour coding for Risk Status and Risk Appetite badges.
// Each tone carries a muted dark-mode variant so pills stay readable on dark surfaces.

export const STATUS_STYLES = {
  'Open': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Active': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Closed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  'Under Review': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300',
  'Monitoring': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Accepted': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  'Escalated': 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  'On Hold': 'bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300',
};

export const getStatusStyle = (status) =>
  STATUS_STYLES[status] || 'bg-muted text-muted-foreground';

export const APPETITE_STYLES = {
  'Within Appetite': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  'Outside Appetite': 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
};

export const getAppetiteStyle = (appetite) =>
  APPETITE_STYLES[appetite] || 'bg-muted text-muted-foreground';