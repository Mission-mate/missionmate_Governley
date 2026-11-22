import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { localToday } from '@/lib/localClock';

const LocalDayContext = createContext(null);

/**
 * The device's current calendar day ('yyyy-MM-dd'). Changes at local midnight,
 * or when the app resumes after being backgrounded across midnight — add it to
 * the dependencies of any memoised Today/overdue/expiry calculation.
 */
export function useLocalToday() {
  return useContext(LocalDayContext) ?? localToday();
}

/**
 * Tracks day rollovers. On a new day it publishes the new date and refetches
 * active data, so date-derived states (Today, overdue, due soon, expiry)
 * recompute against the device's new local day.
 */
export default function LocalDayProvider({ children }) {
  const queryClient = useQueryClient();
  const [day, setDay] = useState(localToday);

  useEffect(() => {
    let timer;
    let current = localToday();
    const check = () => {
      const next = localToday();
      if (next === current) return;
      current = next;
      setDay(next);
      queryClient.invalidateQueries();
    };
    const scheduleMidnight = () => {
      const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
      timer = setTimeout(() => { check(); scheduleMidnight(); }, midnight - now);
    };
    const onVisible = () => { if (document.visibilityState === 'visible') check(); };

    scheduleMidnight();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, [queryClient]);

  return <LocalDayContext.Provider value={day}>{children}</LocalDayContext.Provider>;
}