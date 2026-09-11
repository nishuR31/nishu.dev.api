import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHardReset = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-6">
          <div className="max-w-lg w-full p-8 rounded-3xl glass-panel text-center space-y-6">
            <div className="w-20 h-20 mx-auto bg-[var(--destructive)]/10 rounded-full flex items-center justify-center text-[var(--destructive)] border border-[var(--destructive)]/20 mb-6">
              <AlertTriangle className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-bold text-[var(--foreground)] font-outfit">
              Something went wrong
            </h1>

            <p className="text-[var(--muted-foreground)] text-sm leading-relaxed">
              The admin panel encountered an unexpected error. You can try again or reload the page.
            </p>

            {this.state.error && (
              <div className="p-4 bg-[var(--muted)] border border-[var(--border)] rounded-xl text-left overflow-auto max-h-32">
                <code className="text-xs text-[var(--destructive)] font-mono">
                  {this.state.error.message || "Unknown error occurred"}
                </code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[var(--border)] hover:bg-[var(--muted)] text-[var(--foreground)] font-semibold transition-all"
              >
                <RefreshCcw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleHardReset}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[var(--foreground)] text-[var(--background)] font-semibold transition-all hover:opacity-90"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
