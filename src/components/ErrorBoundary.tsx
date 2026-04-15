import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, showDetails: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleRefresh = () => window.location.reload();
  handleHome = () => (window.location.href = "/");
  toggleDetails = () => this.setState((s) => ({ showDetails: !s.showDetails }));

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-bold text-foreground">
            {this.props.fallbackTitle || "Something went wrong 😔"}
          </h1>
          <p className="text-muted-foreground">
            We've logged this issue. Please try refreshing the page.
          </p>

          <div className="flex gap-3 justify-center">
            <Button onClick={this.handleRefresh} className="gap-2">
              <RefreshCw className="w-4 h-4" /> Refresh Page
            </Button>
            <Button variant="outline" onClick={this.handleHome} className="gap-2">
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </div>

          <button
            onClick={this.toggleDetails}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto transition-colors"
          >
            Error details
            {this.state.showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {this.state.showDetails && (
            <pre className="text-left text-xs font-mono bg-muted/50 border border-border rounded-lg p-4 overflow-auto max-h-48 text-destructive">
              {this.state.error?.message}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
