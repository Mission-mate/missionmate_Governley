/** Team member role labels and styling (light + dark). */
export const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', user: 'User' };

export const ROLE_TEXT = {
  owner: 'text-purple-600 dark:text-purple-400',
  admin: 'text-blue-600 dark:text-blue-400',
  user: 'text-foreground',
};

export const ROLE_BADGE = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300',
  user: 'bg-muted text-muted-foreground',
};

export const memberName = (m) => `${m?.first_name || ''} ${m?.last_name || ''}`.trim() || m?.full_name || m?.email || '';