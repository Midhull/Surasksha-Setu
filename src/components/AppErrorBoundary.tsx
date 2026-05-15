import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('%c[RUNTIME_ERROR]%c', 'color: #dc2626; font-weight: bold', 'color: inherit', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[200] bg-[#050507] flex items-center justify-center p-6 text-center">
          <div className="max-w-md glass-panel p-10 rounded-[2.5rem] border-crimson-glow/20 shadow-2xl bg-white/[0.03] backdrop-blur-2xl">
            <div className="w-16 h-16 rounded-2xl bg-crimson-glow/10 flex items-center justify-center mx-auto mb-8 border border-crimson-glow/20">
              <AlertTriangle className="w-8 h-8 text-crimson-glow" />
            </div>
            <h2 className="text-2xl font-light tracking-tight text-white mb-4">Something went wrong</h2>
            <p className="text-silver/40 text-sm leading-relaxed mb-10">
              An unexpected error occurred in the coordination interface. Your safety telemetry and SOS services are still operating in the background.
            </p>
            
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full py-4 rounded-2xl bg-crimson-glow text-white text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-red-600 transition-colors shadow-lg"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Dashboard
              </button>
              <a 
                href="/dashboard"
                className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-silver text-[11px] font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-white/10 transition-colors"
              >
                <Home className="w-4 h-4" />
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
