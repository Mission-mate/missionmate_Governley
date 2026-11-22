export const TREATMENT_OPTIONS = [
  'Avoid (Terminate)',
  'Reduce (Mitigate)',
  'Transfer (Share)',
  'Accept (Tolerate)',
];

export const TREATMENT_STYLES = {
  'Avoid (Terminate)': 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  'Reduce (Mitigate)': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'Transfer (Share)': 'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
  'Accept (Tolerate)': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
};

export const RESOLVE_OPTIONS = ['On Going', 'Due Date'];

export const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

export const STATUS_OPTIONS = [
  'Not Started',
  'In Progress',
  'On Hold',
  'Completed',
];

export const PRIORITY_STYLES = {
  High: 'bg-rose-100 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300',
  Medium: 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  Low: 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
};

export const STATUS_STYLES = {
  'Not Started': 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
  'In Progress': 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  'On Hold': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  Completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
};

/**
 * Progress % implied by a status: Not Started → 0, Completed → 100.
 * Returns null for statuses that leave progress untouched (user-controlled).
 */
export const progressForStatus = (status) => {
  if (status === 'Not Started') return 0;
  if (status === 'Completed') return 100;
  return null;
};

export const newAction = () => ({
  id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  strategy: '',
  title: '',
  description: '',
  owner: '',
  resolve_by: '',
  due_date: '',
  priority: '',
  status: 'Not Started',
  progress: 0,
  completion_date: '',
});