/** Programs Deliverables option lists and badge styling (light + dark). */
export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];
export const HEALTH_OPTIONS = ['On Track', 'At Risk', 'Off Track'];
export const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];
export const TRACK_METHODS = [
  { value: 'completion', label: 'Milestones', description: 'Track completion of key steps' },
  { value: 'count', label: 'Measures', description: 'Track numbers against a target' },
  { value: 'both', label: 'Both', description: 'Track key steps and numbers' },
];
export const tracksEnabled = (d) => d?.track_enabled !== false;
export const UNITS = ['#', '%', '$'];
export const DIRECTIONS = ['Higher is Better', 'Lower is Better'];
/** Column types offered by the Deliverables Customiser (shared Add Column modal). */
export const COLUMN_TYPES = ['Text/Number', 'Date', 'Single Select', 'Long Text'];
export const optionName = (o) => (typeof o === 'string' ? o : o?.name || o?.label || '');

const STATUS = {
  'Not Started': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
};
const HEALTH = {
  'On Track': 'text-green-600 dark:text-green-400',
  'At Risk': 'text-amber-600 dark:text-amber-400',
  'Off Track': 'text-red-600 dark:text-red-400',
};
const PRIORITY = {
  High: 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  Low: 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
};

export const statusClass = (v) => STATUS[v] || 'bg-muted text-muted-foreground';
export const healthClass = (v) => HEALTH[v] || 'text-muted-foreground';
export const priorityClass = (v) => PRIORITY[v] || 'bg-muted text-muted-foreground';

export const tracksTasks = (d) => tracksEnabled(d) && (d?.track_method || 'completion') !== 'count';
export const tracksData = (d) => tracksEnabled(d) && ['count', 'both'].includes(d?.track_method);

export const normalizeConfig = (cfg) => ({
  show_priority: cfg?.show_priority !== false,
  custom_columns: Array.isArray(cfg?.custom_columns) ? cfg.custom_columns : [],
});