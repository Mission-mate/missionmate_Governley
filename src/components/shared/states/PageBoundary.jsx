import React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from './ErrorBoundary';

/**
 * Page-level render-error boundary. Navigating to a different URL clears a
 * previously caught error automatically.
 */
export default function PageBoundary({ children }) {
  const { pathname } = useLocation();
  return (
    <ErrorBoundary fullPage resetKey={pathname}>
      {children}
    </ErrorBoundary>
  );
}