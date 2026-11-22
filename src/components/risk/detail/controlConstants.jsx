// Design & Operating effectiveness share the same option set.
export const EFFECTIVENESS_OPTIONS = [
  'Effective',
  'Partially Effective',
  'Ineffective',
  'Not Assessed',
];

// Badge styles for the compact card / table view
export const EFFECTIVENESS_STYLES = {
  'Effective': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-300',
  'Partially Effective': 'bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300',
  'Ineffective': 'bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300',
  'Not Assessed': 'bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300',
};

// Coloured dot for select fields
export const EFFECTIVENESS_DOTS = {
  'Effective': 'bg-emerald-500',
  'Partially Effective': 'bg-amber-500',
  'Ineffective': 'bg-red-500',
  'Not Assessed': 'bg-slate-400',
};

// Help tooltip text for each effectiveness field
export const EFFECTIVENESS_HELP = {
  design: 'Do we have the right control? E.g. An HR policy requiring police checks.',
  operating: 'Are we following the control? E.g. Police checks are completed before hiring staff.',
};

export const newControl = () => ({
  id: `ctrl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  control: '',
  description: '',
  design_effectiveness: 'Not Assessed',
  operating_effectiveness: 'Not Assessed',
  notes: '',
});