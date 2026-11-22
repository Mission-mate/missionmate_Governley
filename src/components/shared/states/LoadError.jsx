import React from 'react';
import ErrorState from '@/components/shared/states/ErrorState';
import { ELEVATED_CARD } from '@/components/shared/cardStyles';
import useStagedRetry from '@/hooks/useStagedRetry';
import { cn } from '@/lib/utils';

/**
 * Shown when data failed to load — distinct from an empty list or a missing
 * record, so a temporary outage never looks like data is gone.
 * Offers only "Try again" at first; "Refresh page" joins it once retrying keeps failing.
 * `failure` is a query result or a loadFailure() from lib/readState.
 * `page` adds page gutters for use as a whole-page state.
 */
export default function LoadError({
  failure,
  title = 'Couldn’t load this data',
  description = 'Something went wrong while loading. Your data hasn’t been changed. Check your connection and try again.',
  page = false,
  className,
}) {
  const { retry, onRefresh } = useStagedRetry(() => failure.refetch());

  const card = (
    <div className={cn(ELEVATED_CARD, className)}>
      <ErrorState
        title={title}
        description={description}
        onRetry={retry}
        onRefresh={onRefresh}
        retrying={failure.isFetching}
      />
    </div>
  );
  return page ? <div className="p-6 lg:p-8 max-w-3xl mx-auto w-full">{card}</div> : card;
}