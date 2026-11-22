import React from 'react';
import ErrorFallback from './ErrorFallback';

/**
 * Reusable render-error boundary.
 *
 * Props:
 * - resetKey: when this value changes, a caught error is cleared automatically
 *   (e.g. the active tab value or record id).
 * - fullPage: use the page-sized fallback layout.
 * - fallback: optional custom fallback — receives ({ retry }).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
    this.retry = this.retry.bind(this);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(`ErrorBoundary caught an error: ${error?.message || error}`, error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, retryCount: this.state.retryCount + 1 });
    }
  }

  retry() {
    this.setState((s) => ({ hasError: false, retryCount: s.retryCount + 1 }));
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback({ retry: this.retry });
      return <ErrorFallback onRetry={this.retry} fullPage={this.props.fullPage} />;
    }
    // Remount the subtree on retry so the failed render is re-run from scratch.
    return <React.Fragment key={this.state.retryCount}>{this.props.children}</React.Fragment>;
  }
}