"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="error-boundary-fallback">
          <p>Something went wrong rendering this section.</p>
          {this.state.error && (
            <p className="error-boundary-detail">{this.state.error.message}</p>
          )}
          <button
            className="settings-panel-btn"
            onClick={this.handleRetry}
            style={{ marginTop: 12 }}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
