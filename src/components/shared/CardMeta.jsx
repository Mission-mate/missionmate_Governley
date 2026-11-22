import React from 'react';
import PersonInitialsAvatar from '@/components/shared/PersonInitialsAvatar';
import { FilledCalendarIcon } from '@/components/programs/FilledMetaIcons';

// Shared owner/date rows for Program, Project, Planner and Strategy cards.
// Each row renders only when its value is provided.
const ROW = 'flex items-center gap-1.5 text-[13px] font-medium text-[#5b6270] dark:text-muted-foreground min-w-0';

export function CardOwner({ name }) {
  if (!name) return null;
  return (
    <div className={ROW}>
      <PersonInitialsAvatar name={name} className="h-5 w-5 text-[9px] shrink-0" />
      <span className="truncate">{name}</span>
    </div>
  );
}

export function CardDate({ children }) {
  if (!children) return null;
  return (
    <div className={ROW}>
      <span aria-hidden="true" className="shrink-0 inline-flex items-center justify-center rounded-full h-5 w-5 bg-[#E8EDF7] text-[#3F5798] dark:bg-primary/20 dark:text-primary-foreground">
        <FilledCalendarIcon className="w-3 h-3" />
      </span>
      <span className="truncate">{children}</span>
    </div>
  );
}