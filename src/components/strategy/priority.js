/** Priority + status options and coloured badge styling (light tone + translucent dark tint), shared by every layer. */
export const PRIORITY_OPTIONS = ['High', 'Medium', 'Low'];

export const PRIORITY_STYLES = {
  'High': 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  'Medium': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Low': 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
};

export function priorityStyle(priority) {
  return PRIORITY_STYLES[priority] || 'bg-muted text-muted-foreground';
}

export const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed', 'On Hold', 'Cancelled'];

export const STATUS_STYLES = {
  'Not Started': 'bg-muted text-muted-foreground',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Completed': 'bg-green-100 text-green-700 dark:bg-green-400/15 dark:text-green-300',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
};

export function statusStyle(status) {
  return STATUS_STYLES[status] || 'bg-muted text-muted-foreground';
}