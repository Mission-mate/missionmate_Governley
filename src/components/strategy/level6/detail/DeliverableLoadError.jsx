import React from 'react';
import { useNavigate } from 'react-router-dom';
import TopBarBack from '@/components/shared/TopBarBack';
import ErrorState from '@/components/shared/states/ErrorState';
import useStagedRetry from '@/hooks/useStagedRetry';

/**
 * Inline panel shown when the deliverable page cannot show its item — missing, or failed to load.
 * A failed load offers "Try again", adding "Refresh page" after three failed retries.
 */
export default function DeliverableLoadError({ notFound, onRetry }) {
  const navigate = useNavigate();
  const { retry, retrying, onRefresh } = useStagedRetry(onRetry);
  return (
    <div className="p-6 max-w-7xl mx-auto font-body">
      <TopBarBack onClick={() => navigate('/strategy/register')}>Back to Strategy Register</TopBarBack>
      <div className="rounded-xl border border-border bg-card">
        {notFound ? (
          <ErrorState
            title="Item not found"
            description="This item no longer exists, or its strategy has been removed."
          />
        ) : (
          <ErrorState
            title="Couldn’t load this item"
            description="Something went wrong while loading. Check your connection and try again."
            onRetry={retry}
            onRefresh={onRefresh}
            retrying={retrying}
          />
        )}
      </div>
    </div>
  );
}