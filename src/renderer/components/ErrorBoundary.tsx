import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    if (import.meta.env.DEV) {
      console.error("Renderer error boundary", error, info.componentStack);
    }
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-8">
        <div className="max-w-xl rounded-2xl border border-red-200 bg-white p-6 shadow-executive">
          <div className="flex items-center gap-3 text-red-700">
            <AlertTriangle size={22} />
            <h1 className="text-lg font-bold">GrowthLens Campaign hit an unexpected error</h1>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Your local workspace has not been deleted. Restart the app and try the last action again.
          </p>
          <pre className="mt-4 max-h-44 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
            {this.state.error.message}
          </pre>
        </div>
      </div>
    );
  }
}
